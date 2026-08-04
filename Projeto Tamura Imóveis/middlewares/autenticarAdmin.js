// ===============================
// Autenticar administrador
// ===============================
function autenticarAdmin(req, res, next) {
    if (!req.session.adminAutenticado) {
        return res.status(401).json({
            mensagem:
                "Acesso não autorizado. Faça login para continuar."
        });
    }

    next();
}

// ===============================
// Exportação
// ===============================
module.exports = autenticarAdmin;
