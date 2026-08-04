// ===============================
// Elementos da Busca
// ===============================
const formularioBusca = document.querySelector(".busca form");
const botaoComprar = document.querySelector(".btn-comprar");
const botaoAlugar = document.querySelector(".btn-alugar");
const campoTipo = document.getElementById("tipo");
const campoBairro = document.getElementById("bairro");
const campoPreco = document.getElementById("preco");

let finalidadeSelecionada = "Venda";

// ===============================
// Faixas de Preço
// ===============================
const precosVenda = [
    {
        valor: "",
        texto: "Selecione um Valor"
    },
    {
        valor: "0-300000",
        texto: "Até R$ 300.000"
    },
    {
        valor: "300000-600000",
        texto: "R$ 300.000 até R$ 600.000"
    },
    {
        valor: "600000-1000000",
        texto: "R$ 600.000 até R$ 1.000.000"
    },
    {
        valor: "1000000-2000000",
        texto: "R$ 1.000.000 até R$ 2.000.000"
    },
    {
        valor: "acima2000000",
        texto: "Acima de R$ 2.000.000"
    }
];

const precosAluguel = [
    {
        valor: "",
        texto: "Selecione um Valor"
    },
    {
        valor: "0-1000",
        texto: "Até R$ 1.000"
    },
    {
        valor: "1000-2000",
        texto: "R$ 1.000 até R$ 2.000"
    },
    {
        valor: "2000-3000",
        texto: "R$ 2.000 até R$ 3.000"
    },
    {
        valor: "3000-5000",
        texto: "R$ 3.000 até R$ 5.000"
    },
    {
        valor: "acima5000",
        texto: "Acima de R$ 5.000"
    }
];

// ===============================
// Atualizar Filtro de Preço
// ===============================
function atualizarPrecos(listaPrecos) {

    campoPreco.innerHTML = "";

    listaPrecos.forEach((preco) => {
        const opcao = document.createElement("option");
        opcao.value = preco.valor;
        opcao.textContent = preco.texto;
        campoPreco.appendChild(opcao);
    });
}

// ===============================
// Selecionar Compra
// ===============================
function selecionarCompra() {
    finalidadeSelecionada = "Venda";
    botaoComprar.classList.add("ativo");
    botaoAlugar.classList.remove("ativo");
    atualizarPrecos(precosVenda);
}

// ===============================
// Selecionar Aluguel
// ===============================
function selecionarAluguel() {
    finalidadeSelecionada = "Aluguel";
    botaoAlugar.classList.add("ativo");
    botaoComprar.classList.remove("ativo");
    atualizarPrecos(precosAluguel);
}

// ===============================
// Eventos dos Botões
// ===============================
botaoComprar.addEventListener("click", selecionarCompra);
botaoAlugar.addEventListener("click", selecionarAluguel);

// ===============================
// Enviar Busca
// ===============================
formularioBusca.addEventListener("submit", (event) => {

    event.preventDefault();

    const tipo = campoTipo.value;
    const bairro = campoBairro.value;
    const preco = campoPreco.value;

    const parametros =
        `?tipo=${encodeURIComponent(tipo)}` +
        `&bairro=${encodeURIComponent(bairro)}` +
        `&preco=${encodeURIComponent(preco)}`;

    if (finalidadeSelecionada === "Aluguel") {

        window.location.href =
            `paginas/alugar.html${parametros}`;

        return;
    }

    window.location.href =
        `paginas/comprar.html${parametros}`;
});

// ===============================
// Imóveis em Destaque
// ===============================
const listaDestaques =
    document.getElementById("lista-destaques");

async function renderizarDestaques() {

    try {

        const imoveis = await buscarTodosImoveis();

        listaDestaques.innerHTML = "";

        const imoveisDestaque = imoveis.filter((imovel) => {

            return (
                imovel.destaque &&
                imovel.status === "disponivel"
            );
        });

        if (imoveisDestaque.length === 0) {

            listaDestaques.innerHTML = `
                <p class="sem-imoveis">
                    Nenhum imóvel em destaque no momento.
                </p>
            `;

            return;
        }

        imoveisDestaque.forEach((imovel) => {

            listaDestaques.innerHTML += gerarCardImovel(
                imovel,
                imovel.id,
                "paginas/imovel.html"
            );
        });

    } catch (erro) {

        console.error(
            "Erro ao carregar os destaques:",
            erro
        );

        listaDestaques.innerHTML = `
            <p class="sem-imoveis">
                Não foi possível carregar os imóveis em destaque.
            </p>
        `;
    }
}

// ===============================
// Inicialização
// ===============================
selecionarCompra();
renderizarDestaques();
