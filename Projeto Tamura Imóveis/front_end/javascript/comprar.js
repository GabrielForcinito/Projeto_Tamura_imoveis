// ===============================
// Controle da posição de rolagem
// ===============================
if ("scrollRestoration" in window.history) {
    window.history.scrollRestoration = "manual";
}

// ===============================
// Parâmetros da URL
// ===============================
const parametros = new URLSearchParams(window.location.search);

const tipo = parametros.get("tipo");
const bairro = parametros.get("bairro");
const preco = parametros.get("preco");

const paginaParametro = Number(parametros.get("pagina"));

// ===============================
// Manter filtros selecionados
// ===============================
if (tipo) {
    document.getElementById("tipo").value = tipo;
}

if (bairro) {
    document.getElementById("bairro").value = bairro;
}

if (preco) {
    document.getElementById("preco").value = preco;
}

// ===============================
// Elementos e configurações
// ===============================
const listaImoveis = document.getElementById("lista-imoveis");
const paginacao = document.getElementById("paginacao");

const imoveisPorPagina = 12;

let paginaAtual =
    Number.isInteger(paginaParametro) && paginaParametro > 0
        ? paginaParametro
        : 1;
let imoveis = [];

let posicaoRestaurada = false;

// ===============================
// Restaurar posição da listagem
// ===============================
function restaurarPosicaoNavegacao() {

    if (posicaoRestaurada) {
        return;
    }

    posicaoRestaurada = true;

    const chave = "tamura-scroll-comprar";
    const estadoSalvo = sessionStorage.getItem(chave);

    if (!estadoSalvo) {
        return;
    }

    try {

        const estado = JSON.parse(estadoSalvo);

        const urlAtual =
            window.location.pathname +
            window.location.search;

        const tempoMaximo =
            30 * 60 * 1000;

        const estadoValido =
            estado &&
            estado.url === urlAtual &&
            Number.isFinite(estado.scrollY) &&
            Number.isFinite(estado.salvoEm) &&
            Date.now() - estado.salvoEm <= tempoMaximo;

        sessionStorage.removeItem(chave);

        if (!estadoValido) {
            return;
        }

        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
                window.scrollTo({
                    top: estado.scrollY,
                    left: 0,
                    behavior: "auto"
                });
            });
        });

    } catch (erro) {

        sessionStorage.removeItem(chave);

        console.error(
            "Não foi possível restaurar a posição da página:",
            erro
        );
    }
}

// ===============================
// Manter a página atual na URL
// ===============================
function atualizarPaginaNaUrl(pagina) {

    const urlAtual = new URL(window.location.href);

    if (pagina > 1) {
        urlAtual.searchParams.set("pagina", pagina);
    } else {
        urlAtual.searchParams.delete("pagina");
    }

    window.history.replaceState(
        { pagina },
        "",
        urlAtual
    );
}

// ===============================
// Renderização dos Imóveis
// ===============================
function renderizarImoveis() {

    renderizarListaImoveis({
        imoveis,
        finalidade: "Venda",
        tipo,
        bairro,
        preco,
        paginaAtual,
        imoveisPorPagina,
        listaImoveis,
        paginacao,
        origem: "comprar",

        aoTrocarPagina: (pagina) => {

            paginaAtual = pagina;

            atualizarPaginaNaUrl(paginaAtual);

            renderizarImoveis();

            window.scrollTo({
                top: document.querySelector(".titulo").offsetTop - 20,
                behavior: "smooth"
            });
        }
    });
}

// ===============================
// Carregar Imóveis da API
// ===============================
async function carregarImoveis() {

    try {

        imoveis = await buscarTodosImoveis();

        const totalImoveisFiltrados = getImoveisFiltrados(
            imoveis,
            "Venda",
            tipo,
            bairro,
            preco
        ).length;

        const totalPaginas = Math.max(
            1,
            Math.ceil(totalImoveisFiltrados / imoveisPorPagina)
        );

        if (paginaAtual > totalPaginas) {
            paginaAtual = totalPaginas;
        }

        atualizarPaginaNaUrl(paginaAtual);
        renderizarImoveis();
        restaurarPosicaoNavegacao();

    } catch (erro) {

        console.error("Erro ao carregar os imóveis:", erro);

        listaImoveis.innerHTML = `
            <div class="sem-resultados">
                <h3>Não foi possível carregar os imóveis</h3>
                <p>Tente novamente em alguns instantes.</p>
            </div>
        `;

        paginacao.style.display = "none";
    }
}

// ===============================
// Botão Buscar
// ===============================
const formulario = document.querySelector("form");

formulario.addEventListener("submit", (event) => {

    event.preventDefault();

    const tipoSelecionado =
        document.getElementById("tipo").value;

    const bairroSelecionado =
        document.getElementById("bairro").value;

    const precoSelecionado =
        document.getElementById("preco").value;

    window.location.href =
        `comprar.html?tipo=${tipoSelecionado}` +
        `&bairro=${bairroSelecionado}` +
        `&preco=${precoSelecionado}`;
});

// ===============================
// Inicialização
// ===============================
carregarImoveis();
