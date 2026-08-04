const express = require("express");

const authController =
    require("../controllers/authController");

const router = express.Router();

// ===============================
// Autenticação
// ===============================
router.post(
    "/login",
    authController.login
);

router.get(
    "/verificar",
    authController.verificarAutenticacao
);

router.post(
    "/logout",
    authController.logout
);

module.exports = router;
