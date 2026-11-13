class Produto {
    constructor(nome, preco, quantidade) {
        this.nome = nome;
        this.preco = parseFloat(preco);
        this.quantidade = parseInt(quantidade, 10);
    }
    calcularSubtotal() {
        return this.preco * this.quantidade;
    }
}

const listaDeProdutos = [];
const CHAVE_STORAGE = "sistema_estoque_produtos";
const CHAVE_TEMA = "sistema_estoque_tema";
let indiceEdicao = null;
let timeoutMensagem = null;


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


const formProduto = document.getElementById("produto-form");
const btnLimparTudo = document.getElementById("limpar-tabela");
const totalEstoqueEl = document.getElementById("total-estoque");
const btnAdicionar = document.getElementById("btn-submit-form");
const btnCancelarEdicao = document.getElementById("cancelar-edicao");
const campoBusca = document.getElementById("campo-busca");
const qtdProdutosEl = document.getElementById("quantidade-produtos");
const btnToggleTema = document.getElementById("toggle-tema");
const mensagemErroEl = document.getElementById("mensagem-erro");


const modalConfirmacao = document.getElementById("modal-confirmacao");
const modalConfirmTexto = document.getElementById("modal-confirm-texto");
const btnModalConfirmar = document.getElementById("btn-modal-confirmar");
const btnModalCancelar = document.getElementById("btn-modal-cancelar");

const btnBootstrapInfo = document.getElementById("btn-bootstrap-info");
const modalBootstrap = document.getElementById("modal-bootstrap");
const btnFecharBootstrap = document.getElementById("btn-fechar-bootstrap");


function exibirMensagemInline(texto, tipo = "erro") {
    clearTimeout(timeoutMensagem);
    mensagemErroEl.textContent = texto;
    mensagemErroEl.classList.remove("sucesso");
    if (tipo === "sucesso") {
        mensagemErroEl.classList.add("sucesso");
    }
    mensagemErroEl.hidden = false;

    timeoutMensagem = setTimeout(() => {
        ocultarMensagemInline();
    }, 4500);
}

function ocultarMensagemInline() {
    clearTimeout(timeoutMensagem);
    mensagemErroEl.hidden = true;
    mensagemErroEl.textContent = "";
    mensagemErroEl.classList.remove("sucesso");
}


function abrirModalConfirmacao(mensagem) {
    return new Promise((resolve) => {
        modalConfirmTexto.textContent = mensagem;
        modalConfirmacao.hidden = false;
        btnModalCancelar.focus();

        function finalizar(resposta) {
            modalConfirmacao.hidden = true;
            btnModalConfirmar.removeEventListener("click", aoConfirmar);
            btnModalCancelar.removeEventListener("click", aoCancelar);
            modalConfirmacao.removeEventListener("click", aoClicarFora);
            document.removeEventListener("keydown", aoPressionarEsc);
            resolve(resposta);
        }

        function aoConfirmar() { finalizar(true); }
        function aoCancelar() { finalizar(false); }
        function aoClicarFora(e) {
            if (e.target === modalConfirmacao) finalizar(false);
        }
        function aoPressionarEsc(e) {
            if (e.key === "Escape") finalizar(false);
        }

        btnModalConfirmar.addEventListener("click", aoConfirmar);
        btnModalCancelar.addEventListener("click", aoCancelar);
        modalConfirmacao.addEventListener("click", aoClicarFora);
        document.addEventListener("keydown", aoPressionarEsc);
    });
}

btnBootstrapInfo.addEventListener("click", () => {
    modalBootstrap.hidden = false;
    btnFecharBootstrap.focus();
});

btnFecharBootstrap.addEventListener("click", () => {
    modalBootstrap.hidden = true;
});

modalBootstrap.addEventListener("click", (e) => {
    if (e.target === modalBootstrap) {
        modalBootstrap.hidden = true;
    }
});
formProduto.addEventListener("submit", function (event) {
    event.preventDefault();
    ocultarMensagemInline();

    const nome = document.getElementById("nome").value.trim();
    const preco = parseFloat(document.getElementById("preco").value);
    const quantidade = Number(document.getElementById("quantidade").value);

    if (!nome) {
        exibirMensagemInline("⚠ Por favor, informe um nome válido para o produto.");
        document.getElementById("nome").focus();
        return;
    }
    if (!Number.isFinite(preco) || preco <= 0) {
        exibirMensagemInline("⚠ O preço deve ser um valor numérico maior que zero.");
        document.getElementById("preco").focus();
        return;
    }
    if (!Number.isInteger(quantidade) || quantidade <= 0) {
        exibirMensagemInline("⚠ A quantidade deve ser um número inteiro maior que zero.");
        document.getElementById("quantidade").focus();
        return;
    }

    const novoProduto = new Produto(nome, preco, quantidade);

    if (indiceEdicao === null) {
        listaDeProdutos.push(novoProduto);
        exibirMensagemInline("✦ Produto adicionado ao estoque com sucesso!", "sucesso");
    } else {
        const produtosFiltrados = obterProdutosFiltrados();
        const produtoEditado = produtosFiltrados[indiceEdicao];
        const indiceReal = listaDeProdutos.indexOf(produtoEditado);
       
        if (indiceReal !== -1) {
            listaDeProdutos[indiceReal] = novoProduto;
            exibirMensagemInline("✦ Alterações salvas com sucesso!", "sucesso");
        }
    }

    salvarNoLocalStorage();
    atualizarInterface();
    formProduto.reset();
    indiceEdicao = null;
    btnAdicionar.textContent = "Adicionar Produto";
    btnCancelarEdicao.hidden = true;
});


btnLimparTudo.addEventListener("click", async function () {
    if (listaDeProdutos.length === 0) {
        exibirMensagemInline("⚠ A tabela já está vazia! Não há produtos para remover.");
        return;
    }

    const confirmado = await abrirModalConfirmacao(
        `Tem certeza que deseja apagar todos os ${listaDeProdutos.length} produto(s) do estoque? Esta ação não pode ser desfeita.`
    );

    if (confirmado) {
        listaDeProdutos.length = 0;
        localStorage.removeItem(CHAVE_STORAGE);
        cancelarEdicao();
        atualizarInterface();
        exibirMensagemInline("✦ Todo o estoque foi limpo com sucesso.", "sucesso");
    }
});


function prepararEdicao(index) {
    ocultarMensagemInline();
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
    ocultarMensagemInline();
    btnAdicionar.textContent = "Adicionar Produto";
    btnCancelarEdicao.hidden = true;
}
btnCancelarEdicao.addEventListener("click", cancelarEdicao);


async function removerProduto(index) {
    const produtosFiltrados = obterProdutosFiltrados();
    const produtoParaRemover = produtosFiltrados[index];
    const indiceReal = listaDeProdutos.indexOf(produtoParaRemover);

    if (indiceReal === -1) return;

    const confirmado = await abrirModalConfirmacao(
        `Deseja realmente remover "${produtoParaRemover.nome}" do estoque?`
    );

    if (!confirmado) return;

    if (indiceEdicao === index) {
        cancelarEdicao();
    } else if (indiceEdicao !== null && indiceEdicao > index) {
        indiceEdicao--;
    }

    listaDeProdutos.splice(indiceReal, 1);
    salvarNoLocalStorage();
    atualizarInterface();
    exibirMensagemInline(`✦ Produto "${produtoParaRemover.nome}" removido.`, "sucesso");
}


function obterProdutosFiltrados() {
    const termoBusca = campoBusca.value.toLowerCase().trim();
    return listaDeProdutos.filter(produto => 
        produto.nome.toLowerCase().includes(termoBusca)
    );
}

campoBusca.addEventListener("input", () => {
    if (indiceEdicao !== null) {
        cancelarEdicao();
    }
    atualizarInterface();
});


function atualizarTotalEstoque() {
    const produtosVisiveis = obterProdutosFiltrados();
    const total = produtosVisiveis.reduce((acc, produto) => acc + produto.calcularSubtotal(), 0);
    totalEstoqueEl.textContent = `Total em estoque: ${total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`;
    qtdProdutosEl.textContent = `Produtos encontrados: ${produtosVisiveis.length}`;
}


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

function alternarTema() {
    const isDark = document.body.classList.toggle("dark-mode");
    localStorage.setItem(CHAVE_TEMA, isDark ? "dark" : "light");
}

function carregarTemaSalvo() {
    const temaSalvo = localStorage.getItem(CHAVE_TEMA);
    if (temaSalvo === "dark") {
        document.body.classList.add("dark-mode");
    }
}

btnToggleTema.addEventListener("click", alternarTema);

carregarTemaSalvo();
carregarDoLocalStorage();
atualizarInterface();
