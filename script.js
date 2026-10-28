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
let indiceEdicao = null;

function salvarNoLocalStorage() {
    localStorage.setItem(CHAVE_STORAGE, JSON.stringify(listaDeProdutos));
}

function carregarDoLocalStorage() {
    const dadosSalvos = localStorage.getItem(CHAVE_STORAGE);
    if (dadosSalvos) {
        try {
            const produtosObjetos = JSON.parse(dadosSalvos);
            if (!Array.isArray(produtosObjetos)) {
                throw new Error("Dados inválidos");
            }
            produtosObjetos.forEach((prod) => {
                if (prod && typeof prod.nome === "string" && prod.nome.trim() !== "" && Number.isFinite(Number(prod.preco)) && Number(prod.preco) > 0 && Number.isInteger(Number(prod.quantidade)) && Number(prod.quantidade) > 0) {
                    listaDeProdutos.push(new Produto(prod.nome.trim(), prod.preco, prod.quantidade));
                }
            });
        } catch (erro) {
            listaDeProdutos.length = 0;
            localStorage.removeItem(CHAVE_STORAGE);
        }
    }
}

const formProduto = document.getElementById("produto-form");
const btnLimparTudo = document.getElementById("limpar-tabela");
const totalEstoqueEl = document.getElementById("total-estoque");
const btnAdicionar = document.querySelector(".btn-primary");
const btnCancelarEdicao = document.getElementById("cancelar-edicao");
// NOVO: Referência ao campo de busca (V4)
const campoBusca = document.getElementById("campo-busca");

// CRUD: Create e Update com validação e cláusulas de guarda
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
        // Encontra o produto original se estivemos editando com filtros ativos
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

// CRUD: Delete de todos os produtos
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

// CRUD: Update, preenchendo o formulário com os dados do produto selecionado
function prepararEdicao(index) {
    const produtosFiltrados = obterProdutosFiltrados();
    const produto = produtosFiltrados[index];
    
    if (!produto) {
        return;
    }

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

// CRUD: Delete de um produto pelo índice mapeado
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

// NOVO: Função intermediária de filtragem avançada (V4)
function obterProdutosFiltrados() {
    const termoBusca = campoBusca.value.toLowerCase().trim();
    return listaDeProdutos.filter(produto => 
        produto.nome.toLowerCase().includes(termoBusca)
    );
}

// MODIFICADO: Atualiza o total considerando unicamente os itens visíveis na tela (V4)
function atualizarTotalEstoque() {
    const produtosVisiveis = obterProdutosFiltrados();
    const total = produtosVisiveis.reduce((acc, produto) => acc + produto.calcularSubtotal(), 0);
    totalEstoqueEl.textContent = `Total em estoque: ${total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`;
}

// MODIFICADO: Renderiza os elementos com base no array filtrado e trata lista vazia (V4)
function renderizarTabela() {
    const tabelaBody = document.querySelector("#tabela-produtos tbody");
    tabelaBody.innerHTML = "";
    
    const produtosParaExibir = obterProdutosFiltrados();

    // Feedback visual quando a busca não encontra correspondências ou estoque está vazio
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

// NOVO: Escuta ativa do evento input para atualização dinâmica (V4)
campoBusca.addEventListener("input", atualizarInterface);

carregarDoLocalStorage();
atualizarInterface();
