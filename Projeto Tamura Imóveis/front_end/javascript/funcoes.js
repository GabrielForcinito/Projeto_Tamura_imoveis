// ===============================
// Descrição Inteligente dos Cards
// ===============================
function gerarDescricao(imovel) {

    const quantidade = (valor, singular, plural) => {
        const numero = Number(valor) || 0;
        return `${numero} ${numero === 1 ? singular : plural}`;
    };

    const caracteristicas = [];

    const normalizarTexto = (valor) =>
        String(valor || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim()
            .toLowerCase();

    const tipoNormalizado = normalizarTexto(imovel.tipo);

    const tiposComerciais = [
        "salao comercial",
        "galpao",
        "loja",
        "sobreloja",
        "sala comercial"
    ];

    if (tiposComerciais.includes(tipoNormalizado)) {

        if (Number(imovel.banheiros) > 0) {
            caracteristicas.push(
                quantidade(imovel.banheiros, "Banheiro", "Banheiros")
            );
        }

        if (
            imovel.areaTerreno &&
            imovel.areaTerreno !== "null"
        ) {
            caracteristicas.push(`Terreno: ${imovel.areaTerreno}`);
        }

        if (
            imovel.areaConstruida &&
            imovel.areaConstruida !== "null"
        ) {
            caracteristicas.push(
                `A. Construída: ${imovel.areaConstruida}`
            );
        }

        return caracteristicas.join(" | ");
    }

    if (imovel.tipo === "Sítio") {
        return `Área Total: ${imovel.areaTerreno}`;
    }

    if (imovel.tipo === "Mansão") {
        return [
            quantidade(imovel.quartos, "Quarto", "Quartos"),
            quantidade(imovel.suites, "Suíte", "Suítes"),
            quantidade(imovel.vagas, "Vaga", "Vagas")
        ].join(" | ");
    }

    return [
        quantidade(imovel.quartos, "Quarto", "Quartos"),
        quantidade(imovel.banheiros, "Banheiro", "Banheiros"),
        quantidade(imovel.vagas, "Vaga", "Vagas")
    ].join(" | ");
}

// ===============================
// Status dos Imóveis
// ===============================
function gerarStatus(imovel) {

    if (imovel.status === "disponivel") {
        return {
            texto: "Disponível",
            classe: "status-disponivel"
        };
    }

    if (imovel.status === "vendido") {
        return {
            texto: "Vendido",
            classe: "status-vendido"
        };
    }

    if (imovel.status === "reservado") {
        return {
            texto: "Reservado",
            classe: "status-reservado"
        };
    }

    if (imovel.status === "alugado") {
        return {
            texto: "Alugado",
            classe: "status-alugado"
        };
    }

    return {
        texto: "Indefinido",
        classe: ""
    };
}

// ===============================
// Filtrar Imóveis
// ===============================
function getImoveisFiltrados(
    imoveis,
    finalidade,
    tipo,
    bairro,
    preco
) {

    return imoveis.filter((imovel) => {

        // Apenas imóveis disponíveis
        if (imovel.status !== "disponivel") {
            return false;
        }

        // Finalidade
        if (imovel.finalidade !== finalidade) {
            return false;
        }

        // Tipo
        if (tipo && imovel.tipo !== tipo) {
            return false;
        }

        // Bairro
        if (bairro && imovel.bairro !== bairro) {
            return false;
        }

        // Faixa de preço
        if (preco) {

            if (preco.includes("-")) {

                const [min, max] = preco.split("-").map(Number);

                if (
                    imovel.precoNumerico < min ||
                    imovel.precoNumerico > max
                ) {
                    return false;
                }
            }

            if (preco.startsWith("acima")) {

            const valorMinimo = Number(
                preco.replace("acima", "")
            );

            if (imovel.precoNumerico < valorMinimo) {
                return false;
            }
        }
        }

        return true;
    });
}

// ===============================
// Salvar posição da listagem
// ===============================
function salvarPosicaoNavegacao(origem) {

    if (origem !== "comprar" && origem !== "alugar") {
        return;
    }

    const chave = `tamura-scroll-${origem}`;

    const estadoNavegacao = {
        url:
            window.location.pathname +
            window.location.search,

        scrollY:
            Math.max(0, Math.round(window.scrollY)),

        salvoEm:
            Date.now()
    };

    sessionStorage.setItem(
        chave,
        JSON.stringify(estadoNavegacao)
    );
}

// ===============================
// Gerar Card do Imóvel
// ===============================
function gerarCardImovel(
    imovel,
    id,
    caminhoDetalhes = "imovel.html",
    contextoNavegacao = null
) {

    const status = gerarStatus(imovel);

    const parametrosDetalhes = new URLSearchParams({
        id: String(id)
    });

    if (contextoNavegacao) {
        const {
            origem,
            paginaAtual,
            tipo,
            bairro,
            preco
        } = contextoNavegacao;

        if (origem === "comprar" || origem === "alugar") {
            parametrosDetalhes.set("origem", origem);

            const parametrosRetorno = new URLSearchParams();

            if (Number.isInteger(paginaAtual) && paginaAtual > 1) {
                parametrosRetorno.set("pagina", String(paginaAtual));
            }

            if (tipo) {
                parametrosRetorno.set("tipo", tipo);
            }

            if (bairro) {
                parametrosRetorno.set("bairro", bairro);
            }

            if (preco) {
                parametrosRetorno.set("preco", preco);
            }

            const consultaRetorno = parametrosRetorno.toString();
            const urlRetorno =
                `${origem}.html${consultaRetorno ? `?${consultaRetorno}` : ""}`;

            parametrosDetalhes.set("retorno", urlRetorno);
        }

        if (Number.isInteger(paginaAtual) && paginaAtual > 0) {
            parametrosDetalhes.set("pagina", String(paginaAtual));
        }

        if (tipo) {
            parametrosDetalhes.set("tipo", tipo);
        }

        if (bairro) {
            parametrosDetalhes.set("bairro", bairro);
        }

        if (preco) {
            parametrosDetalhes.set("preco", preco);
        }
    }

    const linkDetalhes =
        `${caminhoDetalhes}?${parametrosDetalhes.toString()}`;

    return `
        <div class="card-imovel">

            <img
                src="${imovel.imagens[0]}"
                alt="${imovel.titulo}"
            >

            <div class="info-imovel">

                <h3>${imovel.titulo}</h3>

                <p class="codigo">${imovel.codigo}</p>

                <p class="status-card ${status.classe}">
                    ${status.texto}
                </p>

                <p class="preco">${imovel.preco}</p>

                <p class="endereco">${imovel.endereco}</p>

                <p class="bairro">
                    Bairro: ${imovel.bairro}
                </p>

                <p class="descricao">
                    ${gerarDescricao(imovel)}
                </p>

                <a
                    href="${linkDetalhes}"
                    class="btn-detalhes"
                >
                    Ver Detalhes →
                </a>

            </div>

        </div>
    `;
}

// ===============================
// Paginação
// ===============================
function renderizarPaginacao(
    totalPaginas,
    paginaAtual,
    paginacao,
    aoTrocarPagina
) {

    paginacao.innerHTML = "";

    if (totalPaginas <= 1) {
        paginacao.style.display = "none";
        return;
    }

    paginacao.style.display = "flex";

    for (let i = 1; i <= totalPaginas; i++) {

        const botao = document.createElement("button");

        botao.textContent = i;
        botao.classList.add("pagina");

        if (i === paginaAtual) {
            botao.classList.add("ativa");
        }

        botao.addEventListener("click", () => {
            aoTrocarPagina(i);
        });

        paginacao.appendChild(botao);
    }
}

// ===============================
// Renderizar Lista de Imóveis
// ===============================
function renderizarListaImoveis({
    imoveis,
    finalidade,
    tipo,
    bairro,
    preco,
    paginaAtual,
    imoveisPorPagina,
    listaImoveis,
    paginacao,
    aoTrocarPagina,
    origem
}) {

    listaImoveis.innerHTML = "";

    const imoveisFiltrados = getImoveisFiltrados(
        imoveis,
        finalidade,
        tipo,
        bairro,
        preco
    );

    const inicio = (paginaAtual - 1) * imoveisPorPagina;
    const fim = inicio + imoveisPorPagina;

    const imoveisPagina = imoveisFiltrados.slice(inicio, fim);

    if (imoveisPagina.length === 0) {

        listaImoveis.innerHTML = `
            <div class="sem-resultados">
                <h3>Nenhum imóvel encontrado</h3>
                <p>Tente alterar os filtros da pesquisa.</p>
            </div>
        `;

        paginacao.style.display = "none";
        return;
    }

    imoveisPagina.forEach((imovel) => {

        listaImoveis.innerHTML += gerarCardImovel(
            imovel,
            imovel.id,
            "imovel.html",
            {
                origem,
                paginaAtual,
                tipo,
                bairro,
                preco
            }
        );
    });

    if (origem === "comprar" || origem === "alugar") {

        const linksDetalhes =
            listaImoveis.querySelectorAll(".btn-detalhes");

        linksDetalhes.forEach((link) => {

            link.addEventListener("click", () => {
                salvarPosicaoNavegacao(origem);
            });
        });
    }

    const totalPaginas = Math.ceil(
        imoveisFiltrados.length / imoveisPorPagina
    );

    renderizarPaginacao(
        totalPaginas,
        paginaAtual,
        paginacao,
        aoTrocarPagina
    );
}
