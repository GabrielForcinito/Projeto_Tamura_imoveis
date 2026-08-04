// ===============================
// Parâmetros e variáveis
// ===============================
const parametros = new URLSearchParams(window.location.search);
const idImovel = parametros.get("id");

const origem = parametros.get("origem");
const paginaOrigem = Number(parametros.get("pagina"));
const tipoOrigem = parametros.get("tipo");
const bairroOrigem = parametros.get("bairro");
const precoOrigem = parametros.get("preco");
const retornoParametro = parametros.get("retorno");

let imagemAtual = 0;
let imovel = null;

const imgPrincipal = document.getElementById("img-principal");
const btnProximo = document.querySelector(".btn-proximo");
const btnAnterior = document.querySelector(".btn-anterior");

// ===============================
// Configura o retorno à listagem
// ===============================
function configurarBotaoVoltar() {

    const botaoVoltar =
        document.querySelector(".btn-voltar");

    if (!botaoVoltar) {
        return;
    }

    // Prioridade 1: endereço de retorno enviado pelo card.
    if (
        retornoParametro &&
        /^(comprar|alugar)\.html(?:\?|$)/.test(retornoParametro)
    ) {
        botaoVoltar.href = retornoParametro;
        botaoVoltar.textContent =
            "← Voltar para página anterior";
        return;
    }

    // Prioridade 2: reconstrução pelos parâmetros separados.
    if (origem === "comprar" || origem === "alugar") {
        const parametrosRetorno = new URLSearchParams();

        if (
            Number.isInteger(paginaOrigem) &&
            paginaOrigem > 1
        ) {
            parametrosRetorno.set(
                "pagina",
                String(paginaOrigem)
            );
        }

        if (tipoOrigem) {
            parametrosRetorno.set("tipo", tipoOrigem);
        }

        if (bairroOrigem) {
            parametrosRetorno.set("bairro", bairroOrigem);
        }

        if (precoOrigem) {
            parametrosRetorno.set("preco", precoOrigem);
        }

        const consulta = parametrosRetorno.toString();

        botaoVoltar.href =
            `${origem}.html${consulta ? `?${consulta}` : ""}`;

        botaoVoltar.textContent =
            "← Voltar para página anterior";
        return;
    }

    // Prioridade 3: página anterior do próprio domínio.
    try {
        const referencia = new URL(document.referrer);
        const mesmaOrigem = referencia.origin === window.location.origin;
        const veioDeListagem = /\/(comprar|alugar)\.html$/.test(
            referencia.pathname
        );

        if (mesmaOrigem && veioDeListagem) {
            botaoVoltar.href =
                `${referencia.pathname}${referencia.search}`;
            botaoVoltar.textContent =
                "← Voltar para página anterior";
            return;
        }
    } catch (erro) {
        // Sem referência válida: usa a página inicial.
    }

    botaoVoltar.href = "../index.html";
    botaoVoltar.textContent =
        "← Voltar para a página inicial";
}

// ===============================
// Detecta orientação da imagem
// ===============================
function ajustarImagem(imgElemento, caminhoImagem) {

    const imagem = new Image();

    imagem.onload = function () {

        if (imagem.height > imagem.width) {

            imgElemento.style.objectFit = "contain";
            imgElemento.style.backgroundColor = "#ffffff";

        } else {

            imgElemento.style.objectFit = "cover";
            imgElemento.style.backgroundColor = "transparent";
        }

        imgElemento.src = caminhoImagem;
    };

    imagem.onerror = function () {

        console.error(`Não foi possível carregar a imagem: ${caminhoImagem}`);
    };

    imagem.src = caminhoImagem;
}

// ===============================
// Atualiza a galeria
// ===============================
function atualizarGaleria() {

    if (!imovel || imovel.imagens.length === 0) {
        return;
    }

    ajustarImagem(
        imgPrincipal,
        imovel.imagens[imagemAtual]
    );

    const miniaturas = document.querySelectorAll(".miniatura");

    miniaturas.forEach((miniatura, indice) => {

        miniatura.classList.remove("ativa");

        if (imovel.imagens[indice]) {

            ajustarImagem(
                miniatura,
                imovel.imagens[indice]
            );
        }
    });

    if (miniaturas[imagemAtual]) {

        miniaturas[imagemAtual].classList.add("ativa");

        miniaturas[imagemAtual].scrollIntoView({
            behavior: "smooth",
            inline: "center",
            block: "nearest"
        });
    }
}

// ===============================
// SEO dinâmico do imóvel
// ===============================
function atualizarSeoImovel() {

    const titulo = `${imovel.titulo} em ${imovel.bairro} | Tamura Imóveis`;

    const finalidadeTexto =
        String(imovel.finalidade || "").toLowerCase() === "aluguel"
            ? "para alugar"
            : "à venda";

    const descricaoBase =
        `${imovel.tipo} ${finalidadeTexto} em ${imovel.bairro}, ` +
        `${imovel.cidade}/${imovel.estado}. ` +
        `${imovel.quartos || 0} quarto(s), ` +
        `${imovel.banheiros || 0} banheiro(s) e ` +
        `${imovel.vagas || 0} vaga(s).`;

    const descricao = descricaoBase.slice(0, 160);
    const urlCanonica =
        `https://tamuraimoveis.com/paginas/imovel.html?id=${encodeURIComponent(idImovel)}`;

    const primeiraImagem =
        Array.isArray(imovel.imagens) && imovel.imagens.length > 0
            ? new URL(imovel.imagens[0], window.location.origin).href
            : "https://tamuraimoveis.com/fotos/logo.png";

    document.title = titulo;

    function atualizarMeta(seletor, conteudo) {
        const elemento = document.querySelector(seletor);
        if (elemento) {
            elemento.setAttribute("content", conteudo);
        }
    }

    atualizarMeta('meta[name="description"]', descricao);
    atualizarMeta('meta[property="og:title"]', titulo);
    atualizarMeta('meta[property="og:description"]', descricao);
    atualizarMeta('meta[property="og:url"]', urlCanonica);
    atualizarMeta('meta[property="og:image"]', primeiraImagem);
    atualizarMeta('meta[property="og:image:alt"]', imovel.titulo);
    atualizarMeta('meta[name="twitter:title"]', titulo);
    atualizarMeta('meta[name="twitter:description"]', descricao);
    atualizarMeta('meta[name="twitter:image"]', primeiraImagem);

    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
        canonical.setAttribute("href", urlCanonica);
    }

    const schema = document.getElementById("schema-imovel");
    if (schema) {
        schema.textContent = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "RealEstateListing",
            "name": imovel.titulo,
            "description": descricao,
            "url": urlCanonica,
            "image": imovel.imagens.map((imagem) =>
                new URL(imagem, window.location.origin).href
            ),
            "address": {
                "@type": "PostalAddress",
                "streetAddress": imovel.endereco,
                "addressLocality": imovel.cidade,
                "addressRegion": imovel.estado,
                "addressCountry": "BR"
            },
            "offers": {
                "@type": "Offer",
                "priceCurrency": "BRL",
                "price": Number(imovel.precoNumerico || imovel.preco || 0),
                "availability": "https://schema.org/InStock",
                "url": urlCanonica
            },
            "provider": {
                "@type": "RealEstateAgent",
                "name": "Tamura Imóveis",
                "url": "https://tamuraimoveis.com/"
            }
        });
    }
}

// ===============================
// Preenche os dados do imóvel
// ===============================
function preencherDadosImovel() {

    document.getElementById("titulo-imovel").textContent =
        imovel.titulo;

    document.getElementById("codigo-imovel").textContent =
        imovel.codigo;

    document.getElementById("preco-imovel").textContent =
        imovel.preco;

    document.getElementById("endereco-imovel").textContent =
        `${imovel.endereco} - ${imovel.bairro} - ` +
        `${imovel.cidade}/${imovel.estado}`;

    // ===============================
    // Status
    // ===============================
    const statusElemento =
        document.getElementById("status-imovel");

    const status = gerarStatus(imovel);

    statusElemento.textContent = status.texto;

    statusElemento.className =
        `status-imovel ${status.classe}`;

    // ===============================
    // Descrição
    // ===============================
    document.getElementById("descricao-imovel").textContent =
        imovel.descricao;

    // ===============================
    // Características
    // ===============================

    // ===============================
    // Quartos
    // ===============================
    const campoQuartos =
        document.getElementById("quartos");

    const cardQuartos =
        campoQuartos.parentElement;

    if (Number(imovel.quartos) > 0) {

        campoQuartos.textContent =
            `${imovel.quartos} Quartos`;

        cardQuartos.style.display = "flex";

    } else {

        cardQuartos.style.display = "none";
    }

    // ===============================
    // Suítes
    // ===============================
    const campoSuites =
        document.getElementById("suites");

    const cardSuites =
        campoSuites.parentElement;

    if (Number(imovel.suites) > 0) {

        campoSuites.textContent =
            `${imovel.suites} Suítes`;

        cardSuites.style.display = "flex";

    } else {

        cardSuites.style.display = "none";
    }

    // ===============================
    // Banheiros
    // ===============================
    const campoBanheiros =
        document.getElementById("banheiros");

    const cardBanheiros =
        campoBanheiros.parentElement;

    if (Number(imovel.banheiros) > 0) {

        campoBanheiros.textContent =
            `${imovel.banheiros} Banheiros`;

        cardBanheiros.style.display = "flex";

    } else {

        cardBanheiros.style.display = "none";
    }

    // ===============================
    // Vagas
    // ===============================
    const campoVagas =
        document.getElementById("vagas");

    const cardVagas =
        campoVagas.parentElement;

    if (Number(imovel.vagas) > 0) {

        campoVagas.textContent =
            `${imovel.vagas} Vagas`;

        cardVagas.style.display = "flex";

    } else {

        cardVagas.style.display = "none";
    }

    // ===============================
    // Área do terreno
    // ===============================
    const campoAreaTerreno =
        document.getElementById("area-terreno");

    const cardAreaTerreno =
        campoAreaTerreno.parentElement;

    if (
        imovel.areaTerreno &&
        imovel.areaTerreno !== "null"
    ) {

        campoAreaTerreno.textContent =
            `Terreno: ${imovel.areaTerreno}`;

        cardAreaTerreno.style.display = "flex";

    } else {

        cardAreaTerreno.style.display = "none";
    }

    // ===============================
    // Área construída
    // ===============================
    const campoAreaConstruida =
        document.getElementById("area-construida");

    const cardAreaConstruida =
        campoAreaConstruida.parentElement;

    if (
        imovel.areaConstruida &&
        imovel.areaConstruida !== "null"
    ) {

        campoAreaConstruida.textContent =
            `A. Construída: ${imovel.areaConstruida}`;

        cardAreaConstruida.style.display = "flex";

    } else {

        cardAreaConstruida.style.display = "none";
    }
}

// ===============================
// Prepara as miniaturas
// ===============================
function prepararMiniaturas() {

    const containerMiniaturas =
        document.querySelector(".miniaturas");

    containerMiniaturas.innerHTML = "";

    imovel.imagens.forEach(
        (caminhoImagem, indice) => {

            const miniatura =
                document.createElement("img");

            miniatura.className = "miniatura";

            miniatura.alt =
                `Miniatura ${indice + 1} do imóvel`;

            miniatura.loading = "lazy";

            ajustarImagem(
                miniatura,
                caminhoImagem
            );

            miniatura.addEventListener(
                "click",
                () => {

                    imagemAtual = indice;

                    atualizarGaleria();
                }
            );

            containerMiniaturas.appendChild(
                miniatura
            );
        }
    );
}

// ===============================
// Configura o carrossel
// ===============================
function configurarCarrossel() {

    if (imovel.imagens.length <= 1) {

        btnProximo.style.display = "none";
        btnAnterior.style.display = "none";

        return;
    }

    btnProximo.addEventListener("click", () => {

        imagemAtual++;

        if (imagemAtual >= imovel.imagens.length) {

            imagemAtual = 0;
        }

        atualizarGaleria();
    });

    btnAnterior.addEventListener("click", () => {

        imagemAtual--;

        if (imagemAtual < 0) {

            imagemAtual =
                imovel.imagens.length - 1;
        }

        atualizarGaleria();
    });
}

// ===============================
// Exibe erro na página
// ===============================
function exibirErro(mensagem) {

    const conteudoPrincipal =
        document.querySelector("main");

    if (conteudoPrincipal) {

        conteudoPrincipal.innerHTML = `
            <section class="sem-resultados">
                <h2>Não foi possível carregar o imóvel</h2>
                <p>${mensagem}</p>

                <a href="../index.html" class="btn-voltar">
                    Voltar para a página inicial
                </a>
            </section>
        `;
    }
}

// ===============================
// Carrega o imóvel da API
// ===============================
async function carregarImovel() {

    const idNumerico = Number(idImovel);

    if (
        !Number.isInteger(idNumerico) ||
        idNumerico <= 0
    ) {

        exibirErro("O identificador informado é inválido.");
        return;
    }

    try {

        imovel = await buscarImovelPorId(idNumerico);

        if (
            !Array.isArray(imovel.imagens) ||
            imovel.imagens.length === 0
        ) {

            exibirErro(
                "Este imóvel ainda não possui imagens cadastradas."
            );

            return;
        }

        atualizarSeoImovel();
        preencherDadosImovel();
        prepararMiniaturas();
        configurarCarrossel();
        atualizarGaleria();

    } catch (erro) {

        console.error(
            "Erro ao carregar os dados do imóvel:",
            erro
        );

        exibirErro(
            "O imóvel não foi encontrado ou o servidor está indisponível."
        );
    }
}

// ===============================
// Inicialização
// ===============================
configurarBotaoVoltar();
carregarImovel();
