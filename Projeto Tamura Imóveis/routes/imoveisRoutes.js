const express = require("express");

const imoveisController = require("../controllers/imoveisController");

const autenticarAdmin = require("../middlewares/autenticarAdmin");
const uploadImagens = require("../middlewares/uploadImagens");

const router = express.Router();

// ===============================
// Listagem pública
// ===============================
router.get("/", imoveisController.listarImoveis);
router.get("/:id/imagens", imoveisController.listarImagensDoImovel);
router.get("/:id", imoveisController.buscarImovelPorId);

// ===============================
// Cadastro protegido
// ===============================
router.post("/", autenticarAdmin, uploadImagens.array("imagens", 15), imoveisController.cadastrarImovel);

// ===============================
// Gerenciamento protegido de imagens
// ===============================
router.post("/:id/imagens", autenticarAdmin, uploadImagens.array("imagens", 15), imoveisController.adicionarImagensAoImovel);
router.patch("/:id/imagens/:imagemId/principal", autenticarAdmin, imoveisController.definirImagemPrincipal);
router.put("/:id/imagens/ordem", autenticarAdmin, imoveisController.atualizarOrdemDasImagens);
router.delete("/:id/imagens/:imagemId", autenticarAdmin, imoveisController.excluirImagemDoImovel);

// ===============================
// Atualização protegida
// ===============================
router.put("/:id", autenticarAdmin, imoveisController.atualizarImovel);

// ===============================
// Exclusão protegida
// ===============================
router.delete("/:id", autenticarAdmin, imoveisController.excluirImovel);

module.exports = router;
