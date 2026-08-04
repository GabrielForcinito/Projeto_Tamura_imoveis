(() => {

    // ===============================
    // Elementos
    // ===============================
    const formulario =
        document.getElementById("formulario-imovel");

    const mensagemFormulario =
        document.getElementById("mensagem-formulario");

    const btnSalvar =
        document.getElementById("btn-salvar");

    const campoImagens =
        document.getElementById("imagens");

    // ===============================
    // Mensagens
    // ===============================
    function exibirMensagem(texto, tipo) {
        mensagemFormulario.textContent = texto;

        mensagemFormulario.className =
            `mensagem-formulario ${tipo}`;
    }

    // ===============================
    // Validar imagens
    // ===============================
    function validarImagens() {
        const arquivos =
            Array.from(campoImagens.files);

        if (arquivos.length === 0) {
            throw new Error(
                "Selecione pelo menos uma imagem."
            );
        }

        if (arquivos.length > 15) {
            throw new Error(
                "Selecione no máximo 15 imagens."
            );
        }

        const tiposPermitidos = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        const tamanhoMaximo =
            8 * 1024 * 1024;

        for (const arquivo of arquivos) {
            if (!tiposPermitidos.includes(arquivo.type)) {
                throw new Error(
                    `O arquivo "${arquivo.name}" possui formato inválido.`
                );
            }

            if (arquivo.size > tamanhoMaximo) {
                throw new Error(
                    `A imagem "${arquivo.name}" ultrapassa o limite de 8 MB.`
                );
            }
        }

        return arquivos;
    }

    // ===============================
    // Preparar FormData
    // ===============================
    function criarFormData() {
        const arquivos = validarImagens();

        const formData = new FormData();

        formData.append(
            "titulo",
            document.getElementById("titulo").value.trim()
        );

        formData.append(
            "codigo",
            document.getElementById("codigo").value.trim()
        );

        formData.append(
            "tipo",
            document.getElementById("tipo").value
        );

        formData.append(
            "finalidade",
            document.getElementById("finalidade").value
        );

        formData.append(
            "status",
            document.getElementById("status").value
        );

        formData.append(
            "preco",
            document.getElementById("preco").value
        );

        formData.append(
            "endereco",
            document.getElementById("endereco").value.trim()
        );

        formData.append(
            "bairro",
            document.getElementById("bairro").value.trim()
        );

        formData.append(
            "cidade",
            document.getElementById("cidade").value.trim()
        );

        formData.append(
            "estado",
            document.getElementById("estado").value.trim()
        );

        formData.append(
            "quartos",
            document.getElementById("quartos").value
        );

        formData.append(
            "suites",
            document.getElementById("suites").value
        );

        formData.append(
            "banheiros",
            document.getElementById("banheiros").value
        );

        formData.append(
            "vagas",
            document.getElementById("vagas").value
        );

        formData.append(
            "areaTerreno",
            document.getElementById("area-terreno").value
        );

        formData.append(
            "areaConstruida",
            document.getElementById("area-construida").value
        );

        formData.append(
            "descricao",
            document.getElementById("descricao").value.trim()
        );

        formData.append(
            "destaque",
            document.getElementById("destaque").checked
                ? "1"
                : "0"
        );

        arquivos.forEach((arquivo) => {
            formData.append(
                "imagens",
                arquivo
            );
        });

        return formData;
    }

    // ===============================
    // Enviar cadastro
    // ===============================
    async function cadastrarImovel(formData) {
        const resposta = await fetch(
            "/api/imoveis",
            {
                method: "POST",
                body: formData
            }
        );

        if (
            autenticacaoAdmin
                .verificarSessaoExpirada(resposta)
        ) {
            return null;
        }

        const tipoResposta =
            resposta.headers.get("content-type") || "";

        if (!tipoResposta.includes("application/json")) {
            throw new Error(
                "O servidor retornou uma resposta inesperada."
            );
        }

        const resultado =
            await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                resultado.mensagem ||
                "Não foi possível cadastrar o imóvel."
            );
        }

        return resultado;
    }

    // ===============================
    // Limpar formulário
    // ===============================
    function limparFormulario() {
        formulario.reset();

        document.getElementById("cidade").value =
            "São Paulo";

        document.getElementById("estado").value =
            "SP";

        document.getElementById("status").value =
            "disponivel";

        document.getElementById("quartos").value = 0;
        document.getElementById("suites").value = 0;
        document.getElementById("banheiros").value = 0;
        document.getElementById("vagas").value = 0;
    }

    // ===============================
    // Envio do formulário
    // ===============================
    formulario.addEventListener(
        "submit",
        async (event) => {
            event.preventDefault();

            mensagemFormulario.textContent = "";

            mensagemFormulario.className =
                "mensagem-formulario";

            btnSalvar.disabled = true;

            btnSalvar.textContent =
                "Cadastrando...";

            try {
                const formData =
                    criarFormData();

                const resultado =
                    await cadastrarImovel(formData);

                if (!resultado) {
                    return;
                }

                exibirMensagem(
                    resultado.mensagem,
                    "sucesso"
                );

                limparFormulario();

                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });

            } catch (erro) {
                console.error(
                    "Erro ao cadastrar imóvel:",
                    erro
                );

                exibirMensagem(
                    erro.message,
                    "erro"
                );

            } finally {
                btnSalvar.disabled = false;

                btnSalvar.textContent =
                    "Cadastrar imóvel";
            }
        }
    );

    // ===============================
    // Inicialização
    // ===============================
    async function inicializarCadastro() {
        const autenticado =
            await autenticacaoAdmin
                .verificarAutenticacao();

        if (!autenticado) {
            return;
        }

        formulario.style.display = "";
    }

    inicializarCadastro();

})();
