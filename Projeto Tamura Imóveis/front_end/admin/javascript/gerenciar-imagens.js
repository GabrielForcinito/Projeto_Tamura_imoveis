(() => {

    // ===============================
    // Configurações
    // ===============================
    const LIMITE_IMAGENS = 15;
    const LIMITE_TAMANHO_IMAGEM = 8 * 1024 * 1024;

    const TIPOS_IMAGEM_PERMITIDOS = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    // ===============================
    // Parâmetros
    // ===============================
    const parametrosImagens =
        new URLSearchParams(window.location.search);

    const idImovelImagens =
        Number(parametrosImagens.get("id"));

    // ===============================
    // Elementos
    // ===============================
    const mensagemImagens =
        document.getElementById("mensagem-imagens");

    const listaImagens =
        document.getElementById("lista-imagens");

    const contadorImagens =
        document.getElementById("contador-imagens");

    const novasImagens =
        document.getElementById("novas-imagens");

    const btnAdicionarImagens =
        document.getElementById("btn-adicionar-imagens");

    // ===============================
    // Estado
    // ===============================
    let imagensAtuais = [];

    // ===============================
    // Mensagens
    // ===============================
    function exibirMensagemImagens(texto, tipo) {
        mensagemImagens.textContent = texto;

        mensagemImagens.className =
            `mensagem-formulario ${tipo}`;
    }

    function limparMensagemImagens() {
        mensagemImagens.textContent = "";

        mensagemImagens.className =
            "mensagem-formulario";
    }

    // ===============================
    // Atualizar contador
    // ===============================
    function atualizarContadorImagens(total) {
        contadorImagens.textContent =
            `${total} de ${LIMITE_IMAGENS} imagens`;
    }

    // ===============================
    // Atualizar campo de upload
    // ===============================
    function atualizarEstadoUpload() {
        const limiteAtingido =
            imagensAtuais.length >= LIMITE_IMAGENS;

        novasImagens.disabled =
            limiteAtingido;

        btnAdicionarImagens.disabled =
            limiteAtingido ||
            novasImagens.files.length === 0;

        if (limiteAtingido) {
            novasImagens.value = "";
        }
    }

    // ===============================
    // Bloquear ações
    // ===============================
    function definirEstadoAcoesImagens(desabilitado) {
        const botoes = listaImagens.querySelectorAll(
            ".btn-imagem, .btn-ordem"
        );

        botoes.forEach((botao) => {
            botao.disabled = desabilitado;
        });

        novasImagens.disabled = desabilitado;
        btnAdicionarImagens.disabled = desabilitado;
    }

    // ===============================
    // Validar imagens selecionadas
    // ===============================
    function validarImagensSelecionadas(arquivos) {
        const quantidadeDisponivel =
            LIMITE_IMAGENS - imagensAtuais.length;

        if (arquivos.length === 0) {
            throw new Error(
                "Selecione pelo menos uma imagem."
            );
        }

        if (arquivos.length > quantidadeDisponivel) {
            throw new Error(
                `Você pode adicionar no máximo mais ${quantidadeDisponivel} imagem(ns).`
            );
        }

        arquivos.forEach((arquivo) => {
            if (
                !TIPOS_IMAGEM_PERMITIDOS.includes(
                    arquivo.type
                )
            ) {
                throw new Error(
                    `O arquivo "${arquivo.name}" possui um formato inválido.`
                );
            }

            if (
                arquivo.size >
                LIMITE_TAMANHO_IMAGEM
            ) {
                throw new Error(
                    `O arquivo "${arquivo.name}" ultrapassa o limite de 8 MB.`
                );
            }
        });
    }

    // ===============================
    // Adicionar imagens
    // ===============================
    async function adicionarImagens() {
        limparMensagemImagens();

        const arquivos = Array.from(
            novasImagens.files
        );

        try {
            validarImagensSelecionadas(
                arquivos
            );

        } catch (erro) {
            exibirMensagemImagens(
                erro.message,
                "erro"
            );

            novasImagens.value = "";
            atualizarEstadoUpload();
            return;
        }

        definirEstadoAcoesImagens(true);

        const textoOriginal =
            btnAdicionarImagens.textContent;

        btnAdicionarImagens.textContent =
            "Adicionando...";

        try {
            const dadosFormulario =
                new FormData();

            arquivos.forEach((arquivo) => {
                dadosFormulario.append(
                    "imagens",
                    arquivo
                );
            });

            const resposta = await fetch(
                `/api/imoveis/${idImovelImagens}/imagens`,
                {
                    method: "POST",
                    body: dadosFormulario
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
                    "Não foi possível adicionar as imagens."
                );
            }

            novasImagens.value = "";

            exibirMensagemImagens(
                resultado.mensagem,
                "sucesso"
            );

            await carregarImagens(false);

        } catch (erro) {
            console.error(
                "Erro ao adicionar imagens:",
                erro
            );

            exibirMensagemImagens(
                erro.message,
                "erro"
            );

            renderizarImagens(
                imagensAtuais
            );

        } finally {
            btnAdicionarImagens.textContent =
                textoOriginal;

            atualizarEstadoUpload();
        }
    }

// ===============================
    // Definir imagem principal
    // ===============================
    async function definirImagemPrincipal(imagemId) {
        limparMensagemImagens();
        definirEstadoAcoesImagens(true);

        try {
            const resposta = await fetch(
                `/api/imoveis/${idImovelImagens}/imagens/${imagemId}/principal`,
                {
                    method: "PATCH"
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
                    "Não foi possível definir a imagem principal."
                );
            }

            exibirMensagemImagens(
                resultado.mensagem,
                "sucesso"
            );

            await carregarImagens(false);

        } catch (erro) {
            console.error(
                "Erro ao definir imagem principal:",
                erro
            );

            exibirMensagemImagens(
                erro.message,
                "erro"
            );

            renderizarImagens(
                imagensAtuais
            );

        } finally {
            atualizarEstadoUpload();
        }
    }

    // ===============================
    // Excluir imagem
    // ===============================
    async function excluirImagem(imagemId, numeroImagem) {
        const confirmou = window.confirm(
            `Deseja realmente excluir a Imagem ${numeroImagem}?`
        );

        if (!confirmou) {
            return;
        }

        limparMensagemImagens();
        definirEstadoAcoesImagens(true);

        try {
            const resposta = await fetch(
                `/api/imoveis/${idImovelImagens}/imagens/${imagemId}`,
                {
                    method: "DELETE"
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
                    "Não foi possível excluir a imagem."
                );
            }

            exibirMensagemImagens(
                resultado.mensagem,
                "sucesso"
            );

            await carregarImagens(false);

        } catch (erro) {
            console.error(
                "Erro ao excluir imagem:",
                erro
            );

            exibirMensagemImagens(
                erro.message,
                "erro"
            );

            renderizarImagens(
                imagensAtuais
            );

        } finally {
            atualizarEstadoUpload();
        }
    }

    // ===============================
    // Salvar ordem das imagens
    // ===============================
    async function salvarOrdemImagens(imagensReordenadas) {
        limparMensagemImagens();
        definirEstadoAcoesImagens(true);

        try {
            const resposta = await fetch(
                `/api/imoveis/${idImovelImagens}/imagens/ordem`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        imagens:
                            imagensReordenadas.map(
                                (imagem) => ({
                                    id: imagem.id
                                })
                            )
                    })
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
                    "Não foi possível atualizar a ordem das imagens."
                );
            }

            exibirMensagemImagens(
                "Ordem das imagens atualizada com sucesso.",
                "sucesso"
            );

            await carregarImagens(false);

        } catch (erro) {
            console.error(
                "Erro ao atualizar ordem das imagens:",
                erro
            );

            exibirMensagemImagens(
                erro.message,
                "erro"
            );

            renderizarImagens(
                imagensAtuais
            );

        } finally {
            atualizarEstadoUpload();
        }
    }

// ===============================
    // Mover imagem
    // ===============================
    async function moverImagem(indiceAtual, direcao) {
        const novoIndice =
            indiceAtual + direcao;

        const indiceMinimo = 1;

        const indiceMaximo =
            imagensAtuais.length - 1;

        if (
            novoIndice < indiceMinimo ||
            novoIndice > indiceMaximo
        ) {
            return;
        }

        const imagensReordenadas =
            [...imagensAtuais];

        const imagemMovida =
            imagensReordenadas[indiceAtual];

        imagensReordenadas[indiceAtual] =
            imagensReordenadas[novoIndice];

        imagensReordenadas[novoIndice] =
            imagemMovida;

        await salvarOrdemImagens(
            imagensReordenadas
        );
    }

    // ===============================
    // Criar botão da imagem
    // ===============================
    function criarBotaoImagem(texto, classe) {
        const botao =
            document.createElement("button");

        botao.type = "button";

        botao.className =
            `btn-imagem ${classe}`;

        botao.textContent = texto;

        return botao;
    }

    // ===============================
    // Criar botão principal
    // ===============================
    function criarBotaoPrincipal(imagem) {
        const botao = criarBotaoImagem(
            imagem.principal
                ? "Imagem principal"
                : "Definir como principal",

            "btn-definir-principal"
        );

        botao.disabled =
            imagem.principal;

        if (!imagem.principal) {
            botao.addEventListener(
                "click",
                () => {
                    definirImagemPrincipal(
                        imagem.id
                    );
                }
            );
        }

        return botao;
    }

    // ===============================
    // Criar botão de exclusão
    // ===============================
    function criarBotaoExcluir(imagem, indice) {
        const botao = criarBotaoImagem(
            "Excluir",
            "btn-excluir-imagem"
        );

        botao.disabled =
            imagensAtuais.length <= 1;

        if (imagensAtuais.length > 1) {
            botao.addEventListener(
                "click",
                () => {
                    excluirImagem(
                        imagem.id,
                        indice + 1
                    );
                }
            );
        }

        return botao;
    }

    // ===============================
    // Criar botão de ordem
    // ===============================
    function criarBotaoOrdem(
        texto,
        descricao,
        desabilitado,
        callback
    ) {
        const botao =
            document.createElement("button");

        botao.type = "button";
        botao.className = "btn-ordem";
        botao.textContent = texto;
        botao.title = descricao;

        botao.setAttribute(
            "aria-label",
            descricao
        );

        botao.disabled = desabilitado;

        if (!desabilitado) {
            botao.addEventListener(
                "click",
                callback
            );
        }

        return botao;
    }

    // ===============================
    // Criar controles de ordem
    // ===============================
    function criarControlesOrdem(imagem, indice) {
        const controles =
            document.createElement("div");

        controles.className =
            "controles-ordem";

        const imagemPrincipal =
            imagem.principal;

        const naoPodeMoverEsquerda =
            imagemPrincipal ||
            indice <= 1;

        const naoPodeMoverDireita =
            imagemPrincipal ||
            indice >= imagensAtuais.length - 1;

        const btnEsquerda =
            criarBotaoOrdem(
                "←",

                `Mover Imagem ${indice + 1} para a esquerda`,

                naoPodeMoverEsquerda,

                () => moverImagem(
                    indice,
                    -1
                )
            );

        const textoOrdem =
            document.createElement("span");

        textoOrdem.className =
            "texto-ordem";

        textoOrdem.textContent =
            imagemPrincipal
                ? "Capa fixa"
                : "Alterar posição";

        const btnDireita =
            criarBotaoOrdem(
                "→",

                `Mover Imagem ${indice + 1} para a direita`,

                naoPodeMoverDireita,

                () => moverImagem(
                    indice,
                    1
                )
            );

        controles.appendChild(
            btnEsquerda
        );

        controles.appendChild(
            textoOrdem
        );

        controles.appendChild(
            btnDireita
        );

        return controles;
    }

    // ===============================
    // Criar cartão da imagem
    // ===============================
    function criarCartaoImagem(imagem, indice) {
        const cartao =
            document.createElement("article");

        cartao.className =
            "cartao-imagem";

        cartao.dataset.imagemId =
            imagem.id;

        const miniatura =
            document.createElement("img");

        miniatura.className =
            "miniatura-imagem";

        miniatura.src =
            imagem.caminho;

        miniatura.alt =
            `Imagem ${indice + 1} do imóvel`;

        miniatura.loading =
            "lazy";

        const conteudo =
            document.createElement("div");

        conteudo.className =
            "conteudo-cartao-imagem";

        const identificacao =
            document.createElement("div");

        identificacao.className =
            "identificacao-imagem";

        const nomeImagem =
            document.createElement("span");

        nomeImagem.className =
            "nome-imagem";

        nomeImagem.textContent =
            `Imagem ${indice + 1}`;

        identificacao.appendChild(
            nomeImagem
        );

        if (imagem.principal) {
            const seloPrincipal =
                document.createElement("span");

            seloPrincipal.className =
                "selo-principal";

            seloPrincipal.textContent =
                "Principal";

            identificacao.appendChild(
                seloPrincipal
            );
        }

        const controlesOrdem =
            criarControlesOrdem(
                imagem,
                indice
            );

        const acoes =
            document.createElement("div");

        acoes.className =
            "acoes-imagem";

        const btnPrincipal =
            criarBotaoPrincipal(imagem);

        const btnExcluir =
            criarBotaoExcluir(
                imagem,
                indice
            );

        acoes.appendChild(
            btnPrincipal
        );

        acoes.appendChild(
            btnExcluir
        );

        conteudo.appendChild(
            identificacao
        );

        conteudo.appendChild(
            controlesOrdem
        );

        conteudo.appendChild(
            acoes
        );

        cartao.appendChild(
            miniatura
        );

        cartao.appendChild(
            conteudo
        );

        return cartao;
    }

// ===============================
    // Renderizar imagens
    // ===============================
    function renderizarImagens(imagens) {
        listaImagens.innerHTML = "";

        atualizarContadorImagens(
            imagens.length
        );

        if (imagens.length === 0) {
            const mensagem =
                document.createElement("p");

            mensagem.className =
                "mensagem-lista-imagens";

            mensagem.textContent =
                "Nenhuma imagem foi encontrada para este imóvel.";

            listaImagens.appendChild(
                mensagem
            );

            atualizarEstadoUpload();
            return;
        }

        imagens.forEach(
            (imagem, indice) => {
                const cartao =
                    criarCartaoImagem(
                        imagem,
                        indice
                    );

                listaImagens.appendChild(
                    cartao
                );
            }
        );

        atualizarEstadoUpload();
    }

    // ===============================
    // Exibir erro na lista
    // ===============================
    function exibirErroListaImagens(texto) {
        listaImagens.innerHTML = "";

        const mensagem =
            document.createElement("p");

        mensagem.className =
            "mensagem-lista-imagens";

        mensagem.textContent = texto;

        listaImagens.appendChild(
            mensagem
        );

        atualizarContadorImagens(0);

        novasImagens.disabled = true;

        btnAdicionarImagens.disabled =
            true;
    }

    // ===============================
    // Carregar imagens
    // ===============================
    async function carregarImagens(
        limparMensagem = true
    ) {
        if (limparMensagem) {
            limparMensagemImagens();
        }

        try {
            const resposta = await fetch(
                `/api/imoveis/${idImovelImagens}/imagens`
            );

            const resultado =
                await resposta.json();

            if (!resposta.ok) {
                throw new Error(
                    resultado.mensagem ||
                    "Não foi possível carregar as imagens."
                );
            }

            imagensAtuais = resultado;

            renderizarImagens(
                imagensAtuais
            );

        } catch (erro) {
            console.error(
                "Erro ao carregar imagens:",
                erro
            );

            exibirErroListaImagens(
                "Não foi possível carregar as imagens do imóvel."
            );

            exibirMensagemImagens(
                erro.message,
                "erro"
            );
        }
    }

    // ===============================
    // Seleção de novas imagens
    // ===============================
    novasImagens.addEventListener(
        "change",
        () => {
            limparMensagemImagens();

            const arquivos = Array.from(
                novasImagens.files
            );

            if (arquivos.length === 0) {
                atualizarEstadoUpload();
                return;
            }

            try {
                validarImagensSelecionadas(
                    arquivos
                );

                btnAdicionarImagens.disabled =
                    false;

            } catch (erro) {
                exibirMensagemImagens(
                    erro.message,
                    "erro"
                );

                novasImagens.value = "";

                atualizarEstadoUpload();
            }
        }
    );

    // ===============================
    // Adicionar imagens
    // ===============================
    btnAdicionarImagens.addEventListener(
        "click",
        adicionarImagens
    );

    // ===============================
    // Inicialização
    // ===============================
    async function inicializarGerenciamentoImagens() {
        const autenticado =
            await autenticacaoAdmin
                .verificarAutenticacao();

        if (!autenticado) {
            return;
        }

        if (
            !Number.isInteger(idImovelImagens) ||
            idImovelImagens <= 0
        ) {
            exibirErroListaImagens(
                "Não foi possível identificar o imóvel."
            );

            exibirMensagemImagens(
                "O identificador do imóvel é inválido.",
                "erro"
            );

            return;
        }

        await carregarImagens();
    }

    inicializarGerenciamentoImagens();

})();
