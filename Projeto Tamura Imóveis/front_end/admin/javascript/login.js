(() => {

    // ===============================
    // Elementos
    // ===============================
    const formularioLogin =
        document.getElementById("formulario-login");

    const campoUsuario =
        document.getElementById("usuario");

    const campoSenha =
        document.getElementById("senha");

    const btnVisualizarSenha =
        document.getElementById(
            "btn-visualizar-senha"
        );

    const mensagemLogin =
        document.getElementById("mensagem-login");

    const btnEntrar =
        document.getElementById("btn-entrar");

    // ===============================
    // Visualizar ou esconder senha
    // ===============================
    btnVisualizarSenha.addEventListener(
        "click",
        () => {
            const senhaEstaVisivel =
                campoSenha.type === "text";

            campoSenha.type =
                senhaEstaVisivel
                    ? "password"
                    : "text";

            const textoBotao =
                senhaEstaVisivel
                    ? "Mostrar senha"
                    : "Ocultar senha";

            btnVisualizarSenha.setAttribute(
                "aria-label",
                textoBotao
            );

            btnVisualizarSenha.setAttribute(
                "title",
                textoBotao
            );
        }
    );

    // ===============================
    // Mensagens
    // ===============================
    function exibirMensagem(texto, tipo) {
        mensagemLogin.textContent = texto;

        mensagemLogin.className =
            `mensagem-formulario ${tipo}`;
    }

    function limparMensagem() {
        mensagemLogin.textContent = "";

        mensagemLogin.className =
            "mensagem-formulario";
    }

    // ===============================
    // Verificar sessão existente
    // ===============================
    async function verificarSessaoExistente() {
        try {
            const resposta = await fetch(
                "/api/auth/verificar"
            );

            if (!resposta.ok) {
                return;
            }

            const resultado =
                await resposta.json();

            if (resultado.autenticado) {
                window.location.replace(
                    "index.html"
                );
            }

        } catch (erro) {
            console.error(
                "Erro ao verificar sessão:",
                erro
            );
        }
    }

    // ===============================
    // Realizar login
    // ===============================
    formularioLogin.addEventListener(
        "submit",
        async (event) => {
            event.preventDefault();

            limparMensagem();

            const usuario =
                campoUsuario.value.trim();

            const senha =
                campoSenha.value;

            if (!usuario || !senha) {
                exibirMensagem(
                    "Informe o usuário e a senha.",
                    "erro"
                );

                return;
            }

            btnEntrar.disabled = true;

            btnEntrar.textContent =
                "Entrando...";

            try {
                const resposta = await fetch(
                    "/api/auth/login",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            usuario,
                            senha
                        })
                    }
                );

                const resultado =
                    await resposta.json();

                if (!resposta.ok) {
                    throw new Error(
                        resultado.mensagem ||
                        "Não foi possível realizar o login."
                    );
                }

                exibirMensagem(
                    resultado.mensagem,
                    "sucesso"
                );

                window.setTimeout(() => {
                    window.location.replace(
                        "index.html"
                    );
                }, 700);

            } catch (erro) {
                console.error(
                    "Erro ao realizar login:",
                    erro
                );

                campoSenha.value = "";

                campoSenha.type =
                    "password";

                btnVisualizarSenha.setAttribute(
                    "aria-label",
                    "Mostrar senha"
                );

                btnVisualizarSenha.setAttribute(
                    "title",
                    "Mostrar senha"
                );

                campoSenha.focus();

                exibirMensagem(
                    erro.message,
                    "erro"
                );

            } finally {
                btnEntrar.disabled = false;

                btnEntrar.textContent =
                    "Entrar";
            }
        }
    );

    // ===============================
    // Inicialização
    // ===============================
    verificarSessaoExistente();

})();
