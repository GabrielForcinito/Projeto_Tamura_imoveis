const bcrypt = require("bcrypt");

const ADMIN_USUARIO = String(
    process.env.ADMIN_USUARIO || ""
).trim();

const ADMIN_SENHA_HASH = String(
    process.env.ADMIN_SENHA_HASH || ""
)
    .trim()
    .replace(/\\\$/g, "$");

function configuracoesValidas() {
    return Boolean(ADMIN_USUARIO && ADMIN_SENHA_HASH);
}

async function login(req, res) {
    const usuario = String(req.body.usuario || "").trim();
    const senha = String(req.body.senha || "");

    if (!configuracoesValidas()) {
        console.error("As credenciais administrativas não foram configuradas.");
        return res.status(500).json({
            mensagem: "O login administrativo não está configurado corretamente."
        });
    }

    if (!usuario || !senha) {
        return res.status(400).json({
            mensagem: "Informe o usuário e a senha."
        });
    }

    try {
        const usuarioValido = usuario === ADMIN_USUARIO;
        const senhaValida = await bcrypt.compare(senha, ADMIN_SENHA_HASH);

        if (!usuarioValido || !senhaValida) {
            return res.status(401).json({
                mensagem: "Usuário ou senha inválidos."
            });
        }

        req.session.regenerate((erroSessao) => {
            if (erroSessao) {
                console.error("Erro ao criar sessão administrativa:", erroSessao);
                return res.status(500).json({
                    mensagem: "Não foi possível iniciar a sessão."
                });
            }

            req.session.adminAutenticado = true;
            req.session.adminUsuario = ADMIN_USUARIO;

            req.session.save((erroSalvar) => {
                if (erroSalvar) {
                    console.error("Erro ao salvar sessão administrativa:", erroSalvar);
                    return res.status(500).json({
                        mensagem: "Não foi possível salvar a sessão."
                    });
                }

                return res.status(200).json({
                    mensagem: "Login realizado com sucesso.",
                    usuario: ADMIN_USUARIO
                });
            });
        });
    } catch (erro) {
        console.error("Erro ao validar login administrativo:", erro);
        return res.status(500).json({
            mensagem: "Erro interno ao realizar o login."
        });
    }
}

function verificarAutenticacao(req, res) {
    if (!req.session.adminAutenticado) {
        return res.status(401).json({
            autenticado: false,
            mensagem: "Administrador não autenticado."
        });
    }

    return res.status(200).json({
        autenticado: true,
        usuario: req.session.adminUsuario
    });
}

function logout(req, res) {
    req.session.destroy((erro) => {
        if (erro) {
            console.error("Erro ao encerrar sessão administrativa:", erro);
            return res.status(500).json({
                mensagem: "Não foi possível encerrar a sessão."
            });
        }

        res.clearCookie("tamura.sid", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax"
        });

        return res.status(200).json({
            mensagem: "Sessão encerrada com sucesso."
        });
    });
}

module.exports = {
    login,
    verificarAutenticacao,
    logout
};
