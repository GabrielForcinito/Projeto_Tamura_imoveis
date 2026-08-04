(() => {

    // ===============================
    // Redirecionar para o login
    // ===============================
    function redirecionarParaLogin() {
        window.location.replace("login.html");
    }

    // ===============================
    // Verificar resposta não autorizada
    // ===============================
    function verificarSessaoExpirada(resposta) {
        if (resposta.status !== 401) {
            return false;
        }

        redirecionarParaLogin();
        return true;
    }

    // ===============================
    // Verificar autenticação
    // ===============================
    async function verificarAutenticacao() {
        try {
            const resposta = await fetch(
                "/api/auth/verificar"
            );

            if (!resposta.ok) {
                redirecionarParaLogin();
                return false;
            }

            const resultado =
                await resposta.json();

            if (!resultado.autenticado) {
                redirecionarParaLogin();
                return false;
            }

            return true;

        } catch (erro) {
            console.error(
                "Erro ao verificar autenticação:",
                erro
            );

            redirecionarParaLogin();
            return false;
        }
    }

    // ===============================
    // Realizar logout
    // ===============================
    async function realizarLogout(botao) {
        if (botao) {
            botao.disabled = true;
            botao.textContent = "Saindo...";
        }

        try {
            const resposta = await fetch(
                "/api/auth/logout",
                {
                    method: "POST"
                }
            );

            const resultado =
                await resposta.json();

            if (!resposta.ok) {
                throw new Error(
                    resultado.mensagem ||
                    "Não foi possível encerrar a sessão."
                );
            }

            redirecionarParaLogin();

        } catch (erro) {
            console.error(
                "Erro ao realizar logout:",
                erro
            );

            window.alert(erro.message);

            if (botao) {
                botao.disabled = false;
                botao.textContent = "Sair";
            }
        }
    }

    // ===============================
    // Disponibilizar funções
    // ===============================
    window.autenticacaoAdmin = {
        verificarAutenticacao,
        verificarSessaoExpirada,
        redirecionarParaLogin,
        realizarLogout
    };

})();
