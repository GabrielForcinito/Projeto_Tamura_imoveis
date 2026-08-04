(() => {

    // ===============================
    // Parâmetros
    // ===============================
    const parametrosEdicao =
        new URLSearchParams(window.location.search);

    const idImovelEdicao =
        Number(parametrosEdicao.get("id"));

    // ===============================
    // Elementos
    // ===============================
    const conteudoAdmin =
        document.querySelector(".conteudo-admin");

    const formulario =
        document.getElementById("formulario-imovel");

    const mensagemFormulario =
        document.getElementById("mensagem-formulario");

    const btnSalvar =
        document.getElementById("btn-salvar");

    // ===============================
    // Mensagens
    // ===============================
    function exibirMensagem(texto, tipo) {
        mensagemFormulario.textContent = texto;

        mensagemFormulario.className =
            `mensagem-formulario ${tipo}`;
    }

    function limparMensagem() {
        mensagemFormulario.textContent = "";

        mensagemFormulario.className =
            "mensagem-formulario";
    }

    // ===============================
    // Exibir conteúdo da página
    // ===============================
    function exibirConteudoAdmin() {
        conteudoAdmin.style.display = "block";
    }

    // ===============================
    // Preencher formulário
    // ===============================
    function preencherFormulario(imovel) {
        document.getElementById("titulo").value =
            imovel.titulo;

        document.getElementById("codigo").value =
            imovel.codigo.replace(/^REF:\s*/i, "");

        document.getElementById("tipo").value =
            imovel.tipo;

        document.getElementById("finalidade").value =
            imovel.finalidade.toLowerCase();

        document.getElementById("status").value =
            imovel.status;

        document.getElementById("preco").value =
            imovel.precoNumerico;

        document.getElementById("endereco").value =
            imovel.endereco;

        document.getElementById("bairro").value =
            imovel.bairro;

        document.getElementById("cidade").value =
            imovel.cidade;

        document.getElementById("estado").value =
            imovel.estado;

        document.getElementById("quartos").value =
            imovel.quartos;

        document.getElementById("suites").value =
            imovel.suites ?? 0;

        document.getElementById("banheiros").value =
            imovel.banheiros;

        document.getElementById("vagas").value =
            imovel.vagas;

        document.getElementById("area-terreno").value =
            imovel.areaTerreno
                ? imovel.areaTerreno.replace("m²", "")
                : "";

        document.getElementById("area-construida").value =
            imovel.areaConstruida
                ? imovel.areaConstruida.replace("m²", "")
                : "";

        document.getElementById("descricao").value =
            imovel.descricao;

        document.getElementById("destaque").checked =
            imovel.destaque;
    }

    // ===============================
    // Carregar imóvel
    // ===============================
    async function carregarImovel() {
        try {
            const resposta = await fetch(
                `/api/imoveis/${idImovelEdicao}`
            );

            if (
                autenticacaoAdmin
                    .verificarSessaoExpirada(resposta)
            ) {
                return false;
            }

            const resultado =
                await resposta.json();

            if (!resposta.ok) {
                throw new Error(
                    resultado.mensagem ||
                    "Não foi possível carregar o imóvel."
                );
            }

            preencherFormulario(resultado);

            return true;

        } catch (erro) {
            console.error(
                "Erro ao carregar imóvel:",
                erro
            );

            exibirMensagem(
                erro.message,
                "erro"
            );

            btnSalvar.disabled = true;
            return false;
        }
    }

    // ===============================
    // Obter dados do formulário
    // ===============================
    function obterDadosFormulario() {
        return {
            titulo:
                document
                    .getElementById("titulo")
                    .value
                    .trim(),

            codigo:
                document
                    .getElementById("codigo")
                    .value
                    .trim(),

            tipo:
                document.getElementById("tipo").value,

            finalidade:
                document.getElementById("finalidade").value,

            status:
                document.getElementById("status").value,

            preco:
                document.getElementById("preco").value,

            endereco:
                document
                    .getElementById("endereco")
                    .value
                    .trim(),

            bairro:
                document
                    .getElementById("bairro")
                    .value
                    .trim(),

            cidade:
                document
                    .getElementById("cidade")
                    .value
                    .trim(),

            estado:
                document
                    .getElementById("estado")
                    .value
                    .trim(),

            quartos:
                document.getElementById("quartos").value,

            suites:
                document.getElementById("suites").value,

            banheiros:
                document.getElementById("banheiros").value,

            vagas:
                document.getElementById("vagas").value,

            areaTerreno:
                document
                    .getElementById("area-terreno")
                    .value,

            areaConstruida:
                document
                    .getElementById("area-construida")
                    .value,

            descricao:
                document
                    .getElementById("descricao")
                    .value
                    .trim(),

            destaque:
                document.getElementById("destaque").checked
        };
    }

    // ===============================
    // Salvar alterações
    // ===============================
    formulario.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            limparMensagem();

            btnSalvar.disabled = true;
            btnSalvar.textContent = "Salvando...";

            try {
                const dadosImovel =
                    obterDadosFormulario();

                const resposta = await fetch(
                    `/api/imoveis/${idImovelEdicao}`,
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(dadosImovel)
                    }
                );

                if (
                    autenticacaoAdmin
                        .verificarSessaoExpirada(resposta)
                ) {
                    return;
                }

                const resultado =
                    await resposta.json();

                if (!resposta.ok) {
                    throw new Error(
                        resultado.mensagem ||
                        "Não foi possível atualizar o imóvel."
                    );
                }

                exibirMensagem(
                    resultado.mensagem,
                    "sucesso"
                );

                window.setTimeout(() => {
                    window.location.href =
                        "index.html";
                }, 1000);

            } catch (erro) {
                console.error(
                    "Erro ao atualizar imóvel:",
                    erro
                );

                exibirMensagem(
                    erro.message,
                    "erro"
                );

            } finally {
                btnSalvar.disabled = false;

                btnSalvar.textContent =
                    "Salvar alterações";
            }
        }
    );

    // ===============================
    // Inicialização
    // ===============================
    async function inicializarEdicao() {
        const autenticado =
            await autenticacaoAdmin
                .verificarAutenticacao();

        if (!autenticado) {
            return;
        }

        if (
            !Number.isInteger(idImovelEdicao) ||
            idImovelEdicao <= 0
        ) {
            exibirMensagem(
                "O identificador do imóvel é inválido.",
                "erro"
            );

            btnSalvar.disabled = true;

            exibirConteudoAdmin();
            return;
        }

        await carregarImovel();
        exibirConteudoAdmin();
    }

    inicializarEdicao();

})();
