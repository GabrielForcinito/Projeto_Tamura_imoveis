const fs = require("fs");
const path = require("path");
const multer = require("multer");

require("dotenv").config();

// ===============================
// Configurações
// ===============================
const LIMITE_TAMANHO = 8 * 1024 * 1024;
const LIMITE_ARQUIVOS = 15;

const TIPOS_PERMITIDOS = [
    "image/jpeg",
    "image/png",
    "image/webp"
];

// ===============================
// Pasta de destino
// ===============================
if (!process.env.UPLOADS_PATH) {
    throw new Error(
        "A variável UPLOADS_PATH não foi definida no arquivo .env."
    );
}

const caminhoConfigurado = process.env.UPLOADS_PATH;

const pastaUploads = path.isAbsolute(caminhoConfigurado)
    ? caminhoConfigurado
    : path.resolve(
        __dirname,
        "..",
        caminhoConfigurado
    );

fs.mkdirSync(pastaUploads, {
    recursive: true
});

// ===============================
// Gerar nome seguro
// ===============================
function gerarNomeSeguro(nomeOriginalCompleto) {
    const extensao = path
        .extname(nomeOriginalCompleto)
        .toLowerCase();

    const nomeOriginal = path.basename(
        nomeOriginalCompleto,
        extensao
    );

    const nomeSeguro = nomeOriginal
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9_-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .toLowerCase();

    const nomeBase = nomeSeguro || "imagem";

    const identificadorUnico = [
        Date.now(),
        Math.round(Math.random() * 1e9)
    ].join("-");

    return `${identificadorUnico}-${nomeBase}${extensao}`;
}

// ===============================
// Armazenamento das imagens
// ===============================
const armazenamento = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, pastaUploads);
    },

    filename: (req, file, callback) => {
        const nomeArquivo = gerarNomeSeguro(
            file.originalname
        );

        callback(null, nomeArquivo);
    }
});

// ===============================
// Validar tipo de arquivo
// ===============================
function filtrarImagem(req, file, callback) {
    if (!TIPOS_PERMITIDOS.includes(file.mimetype)) {
        return callback(
            new Error(
                "Formato de imagem inválido. Use JPG, JPEG, PNG ou WEBP."
            )
        );
    }

    callback(null, true);
}

// ===============================
// Configuração do Multer
// ===============================
const uploadImagens = multer({
    storage: armazenamento,
    fileFilter: filtrarImagem,

    limits: {
        fileSize: LIMITE_TAMANHO,
        files: LIMITE_ARQUIVOS
    }
});

module.exports = uploadImagens;
