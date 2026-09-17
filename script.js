class Produto {
    #preco;
    #quantidade;

    constructor(nome, preco, quantidade) {
        if (!nome || nome.trim() === "") {
            throw new Error("O nome do produto não pode estar em branco.");
        }
        
        const precoNum = parseFloat(preco);
        if (isNaN(precoNum) || precoNum <= 0) {
            throw new Error("O preço deve ser um valor maior que zero.");
        }

        const qtdNum = parseInt(quantidade);
        if (isNaN(qtdNum) || qtdNum <= 0) {
            throw new Error("A quantidade deve ser um valor maior que zero.");
        }

        this.nome = nome;
        this.#preco = precoNum;
        this.#quantidade = qtdNum;
    }

    get preco() {
        return this.#preco;
    }

    get quantidade() {
        return this.#quantidade;
    }

    calcularSubtotal() {
        return this.#preco * this.#quantidade;
    }
}

const listaDeProdutos = [];

const formproduto = document.getElementById("produto-form");

formproduto.addEventListener("submit", function (event) {
    event.preventDefault();

    const nomeInput = document.getElementById("nome").value;
    const precoInput = document.getElementById("preco").value;
    const quantidadeInput = document.getElementById("quantidade").value;

    try {
        const novoProduto = new Produto(nomeInput, precoInput, quantidadeInput);

        listaDeProdutos.push(novoProduto);

        renderizarTabela();
        formproduto.reset();
    } catch (error) {
        alert(error.message);
    }
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