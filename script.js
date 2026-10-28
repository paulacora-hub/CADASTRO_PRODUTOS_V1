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
        listaDeProdutos[indiceEdicao] = novoProduto;
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
    const produto = listaDeProdutos[index];
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
// CRUD: Delete de um produto pelo índice
function removerProduto(index) {
    if (indiceEdicao === index) {
        cancelarEdicao();
    } else if (indiceEdicao !== null && indiceEdicao > index) {
        indiceEdicao--;
    }
    listaDeProdutos.splice(index, 1);
    salvarNoLocalStorage();
    atualizarInterface();
}
// CRUD: Read, exibindo os produtos cadastrados
function atualizarTotalEstoque() {
    const total = listaDeProdutos.reduce((acc, produto) => acc + produto.calcularSubtotal(), 0);
    totalEstoqueEl.textContent = `Total em estoque: ${total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`;
}
function renderizarTabela() {
    const tabelaBody = document.querySelector("#tabela-produtos tbody");
    tabelaBody.innerHTML = "";
    listaDeProdutos.forEach((produto, index) => {
        const linha = document.createElement("tr");
        const celNome = document.createElement("td");
        const celPreco = document.createElement("td");
        const celQuantidade = document.createElement("td");
        const celSubtotal = document.createElement("td");
        const celAcoes = document.createElement("td");
        const btnEditar = document.createElement("button");
        const btnRemover = document.createElement("button");
        celNome.textContent = produto.nome;
        celPreco.textContent = produto.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
        celQuantidade.textContent = produto.quantidade;
        celSubtotal.textContent = produto.calcularSubtotal().toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
        btnEditar.textContent = "Editar";
        btnEditar.type = "button";
        btnEditar.className = "btn-editar";
        btnEditar.addEventListener("click", () => prepararEdicao(index));
        btnRemover.textContent = "Remover";
        btnRemover.type = "button";
        btnRemover.className = "btn-remover";
        btnRemover.addEventListener("click", () => removerProduto(index));
        celAcoes.append(btnEditar, btnRemover);
        linha.append(celNome, celPreco, celQuantidade, celSubtotal, celAcoes);
        tabelaBody.appendChild(linha);
    });
}
function atualizarInterface() {
    renderizarTabela();
    atualizarTotalEstoque();
}
carregarDoLocalStorage();
atualizarInterface();