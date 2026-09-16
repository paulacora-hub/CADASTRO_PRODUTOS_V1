class Produto {
    constructor(nome, preco, quantidade) {
        this.nome = nome;
        this.preco = parseFloat(preco);
        this.quantidade = parseInt(quantidade);
    }

    calcularSubtotal() {
        return this.preco * this. quantidade
    }
}

const listaDeProdutos = [];

const formproduto = document.getElementById("produto-form");

formproduto.addEventListener("submit", function (event) {
    event.preventDefault();

    const nomeInput = document.getElementById("nome").value;
    const precoInput = document.getElementById("preco").value;
    const quantidadeInput = document.getElementById("quantidade").value;

    const novoProduto = new Produto(nomeInput, precoInput, quantidadeInput);

    listaDeProdutos.push(novoProduto);

    renderizarTabela();
    formproduto.reseet();
});

function renderizarTabela() {
    const tabelaBody = document.querySelector("#tabela-produtos tbody");

    tabelaBody.innerHTML = "";

    listaDeProdutos.forEach((produto) => {
        const linha = document.createElement("tr");

        linha.innerHTML = `
        <td>${produto.nome}</td>
        <td>R$ ${produto.preco.toFixed(2)}</td>
        <td>${produto.quantidade}</td>
        <td>R$ ${produto.calcularSubtotal().toFixed(2)}</td>
        <td>
            <button class="btn-remover">Remover</button>
        </td>
        `;

        tabelaBody.appendChild(linha);
    });
}