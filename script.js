class Produto {
    constructor(nome, preco, quantidade) {
        this.nome = nome;
        this.preco = parseFloat(preco);
        this.quantidade = parseInt(quantidade);
    }
    calcularSubtotal() {
        return this.preco * this.quantidade;
    }
}

const listaDeProdutos = [];
const CHAVE_STORAGE = "sistema_estoque_produtos";
const CHAVE_TEMA = "sistema_estoque_tema";
let indiceEdicao = null;

// CARREGAR DADOS DO LOCAL STORAGE
function carregarDoLocalStorage() {
    const dadosSalvos = localStorage.getItem(CHAVE_STORAGE);
    if (dadosSalvos) {
        try {
            const produtosObjetos = JSON.parse(dadosSalvos);
            if (!Array.isArray(produtosObjetos)) throw new Error("Dados inválidos");
            
            produtosObjetos.forEach((prod) => {
                if (prod && typeof prod.nome === "string" && prod.nome.trim() !== "" && 
                    Number.isFinite(Number(prod.preco)) && Number(prod.preco) > 0 && 
                    Number.isInteger(Number(prod.quantidade)) && Number(prod.quantidade) > 0) {
                    listaDeProdutos.push(new Produto(prod.nome.trim(), prod.preco, prod.quantidade));
                }
            });
        } catch (erro) {
            listaDeProdutos.length = 0;
            localStorage.removeItem(CHAVE_STORAGE);
        }
    }
}

function salvarNoLocalStorage() {
    localStorage.setItem(CHAVE_STORAGE, JSON.stringify(listaDeProdutos));
}

// CAPTURA DE COMPONENTES DOM
const formProduto = document.getElementById("produto-form");
const btnLimparTudo = document.getElementById("limpar-tabela");
const totalEstoqueEl = document.getElementById("total-estoque");
const btnAdicionar = document.querySelector(".btn-primary");
const btnCancelarEdicao = document.getElementById("cancelar-edicao");
const campoBusca = document.getElementById("campo-busca");
const qtdProdutosEl = document.getElementById("quantidade-produtos");
const btnToggleTema = document.getElementById("toggle-tema");

// SUBMIT DO FORMULÁRIO (CREATE / UPDATE)
formProduto.addEventListener("submit", function (event) {
    event.preventDefault();
    const nome = document.getElementById("nome").value.trim();
    const preco = parseFloat(document.getElementById("preco").value);
    const quantidade = Number(document.getElementById("quantidade").value);

    if (!nome) {
        alert("Por favor, informe um nome válido para o produto.");
        return;
    }
    if (!Number.isFinite(preco) || preco <= 0 || !Number.isInteger(quantidade) || quantidade <= 0) {
        alert("O preço deve ser maior que zero e a quantidade deve ser um número inteiro maior que zero.");
        return;
    }

    const novoProduto = new Produto(nome, preco, quantidade);

    if (indiceEdicao === null) {
        listaDeProdutos.push(novoProduto);
    } else {
        const produtosFiltrados = obterProdutosFiltrados();
        const produtoEditado = produtosFiltrados[indiceEdicao];
        const indiceReal = listaDeProdutos.indexOf(produtoEditado);
       
        if (indiceReal !== -1) {
            listaDeProdutos[indiceReal] = novoProduto;
        }
    }

    salvarNoLocalStorage();
    atualizarInterface();
    formProduto.reset();
    indiceEdicao = null;
    btnAdicionar.textContent = "Adicionar Produto";
    btnCancelarEdicao.hidden = true;
});

// REMOVER TUDO (DELETE COMPLETO)
btnLimparTudo.addEventListener("click", function () {
    if (listaDeProdutos.length === 0) {
        alert("A tabela já está vazia!");
        return;
    }
    if (confirm("Tem certeza que deseja remover todos os produtos?")) {
        listaDeProdutos.length = 0;
        localStorage.removeItem(CHAVE_STORAGE);
        cancelarEdicao();
        atualizarInterface();
    }
});

// PREPARAR E CANCELAR EDIÇÃO
function prepararEdicao(index) {
    const produtosFiltrados = obterProdutosFiltrados();
    const produto = produtosFiltrados[index];
   
    if (!produto) return;

    document.getElementById("nome").value = produto.nome;
    document.getElementById("preco").value = produto.preco;
    document.getElementById("quantidade").value = produto.quantidade;
   
    indiceEdicao = index;
    btnAdicionar.textContent = "Salvar Alterações";
    btnCancelarEdicao.hidden = false;
    document.getElementById("nome").focus();
}

function cancelarEdicao() {
    indiceEdicao = null;
    formProduto.reset();
    btnAdicionar.textContent = "Adicionar Produto";
    btnCancelarEdicao.hidden = true;
}
btnCancelarEdicao.addEventListener("click", cancelarEdicao);

// REMOVER PRODUTO ÚNICO
function removerProduto(index) {
    const produtosFiltrados = obterProdutosFiltrados();
    const produtoParaRemover = produtosFiltrados[index];
    const indiceReal = listaDeProdutos.indexOf(produtoParaRemover);

    if (indiceReal === -1) return;

    if (indiceEdicao === index) {
        cancelarEdicao();
    } else if (indiceEdicao !== null && indiceEdicao > index) {
        indiceEdicao--;
    }

    listaDeProdutos.splice(indiceReal, 1);
    salvarNoLocalStorage();
    atualizarInterface();
}

// FILTRAGEM AVANÇADA (REVISADA E CONCLUÍDA)
function obterProdutosFiltrados() {
    const termoBusca = campoBusca.value.toLowerCase().trim();
    return listaDeProdutos.filter(produto => 
        produto.nome.toLowerCase().includes(termoBusca)
    );
}

// ATUALIZAR TOTAL DO ESTOQUE
function atualizarTotalEstoque() {
    const produtosVisiveis = obterProdutosFiltrados();
    const total = produtosVisiveis.reduce((acc, produto) => acc + produto.calcularSubtotal(), 0);
    totalEstoqueEl.textContent = `Total em estoque: ${total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`;
    qtdProdutosEl.textContent = `Produtos encontrados: ${produtosVisiveis.length}`;
}

// RENDERIZAR TABELA DADOS
function renderizarTabela() {
    const tabelaBody = document.querySelector("#tabela-produtos tbody");
    tabelaBody.innerHTML = "";
    
    const produtosParaExibir = obterProdutosFiltrados();

    if (produtosParaExibir.length === 0) {
        const linhaMensagem = document.createElement("tr");
        const celMensagem = document.createElement("td");
        celMensagem.colSpan = 5;
        celMensagem.className = "mensagem-vazia";
        celMensagem.textContent = listaDeProdutos.length === 0 
            ? "Nenhum produto cadastrado." 
            : "Nenhum produto correspondente à pesquisa foi localizado.";
        linhaMensagem.appendChild(celMensagem);
        tabelaBody.appendChild(linhaMensagem);
        return;
    }

    produtosParaExibir.forEach((produto, index) => {
        const row = document.createElement("tr");
        
        const cellNome = document.createElement("td");
        cellNome.textContent = produto.nome;
        
        const cellPreco = document.createElement("td");
        cellPreco.textContent = produto.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
        
        const cellQtd = document.createElement("td");
        cellQtd.textContent = produto.quantidade;
        
        const cellSubtotal = document.createElement("td");
        cellSubtotal.textContent = produto.calcularSubtotal().toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
        
        const cellAcoes = document.createElement("td");
        
        const btnEditar = document.createElement("button");
        btnEditar.textContent = "Editar";
        btnEditar.type = "button";
        btnEditar.className = "btn-editar";
        btnEditar.addEventListener("click", () => prepararEdicao(index));
        
        const btnRemover = document.createElement("button");
        btnRemover.textContent = "Remover";
        btnRemover.type = "button";
        btnRemover.className = "btn-remover";
        btnRemover.addEventListener("click", () => removerProduto(index));
        
        cellAcoes.append(btnEditar, btnRemover);
        row.append(cellNome, cellPreco, cellQtd, cellSubtotal, cellAcoes);
        tabelaBody.appendChild(row);
    });
}

function atualizarInterface() {
    renderizarTabela();
    atualizarTotalEstoque();
}

// GERENCIAMENTO DA MUDANÇA DE TEMA DINÂMICA
function alternarTema() {
    const isDark = document.body.classList.toggle("dark-mode");
    localStorage.setItem(CHAVE_TEMA, isDark ? "dark" : "light");
    ajustarTextosTema(isDark);
}

function ajustarTextosTema(isDark) {
    const subtitulo = document.getElementById("subtitulo-magico");
    const legenda = document.getElementById("legenda-resumo");
    const labelBusca = document.getElementById("label-busca");
    const rodape = document.getElementById("rodape-magico");

    if (isDark) {
        subtitulo.textContent = "✧ Organize seu estoque com um toque de magia ✧";
        legenda.textContent = "✧ RESUMO DO ESTOQUE";
        labelBusca.textContent = "✦ Pesquisar produto";
        rodape.textContent = "✧ Feito com cuidado, entre estrelas e lavandas ✧";
    } else {
        subtitulo.textContent = "Gerencie seus itens cadastrados de forma simples";
        legenda.textContent = "RESUMO DOS VALORES";
        labelBusca.textContent = "Filtrar por nome:";
        rodape.textContent = "Sistema de Controle de Estoque Corporativo";
    }
}

// INICIALIZAÇÃO DO TEMA SALVO
function carregarTemaSalvo() {
    const temaSalvo = localStorage.getItem(CHAVE_TEMA);
    const prefereEscuro = temaSalvo === "dark";
    
    if (prefereEscuro) {
        document.body.classList.add("dark-mode");
    }
    ajustarTextosTema(prefereEscuro);
}

// OUVINTES DE EVENTOS (LISTENERS)
campoBusca.addEventListener("input", atualizarInterface);
btnToggleTema.addEventListener("click", alternarTema);

// START DO SISTEMA
carregarTemaSalvo();
carregarDoLocalStorage();
atualizarInterface();
