require("dotenv").config();

const fs = require("fs");
const path = require("path");
const express = require("express");
const session = require("express-session");
const multer = require("multer");

require("./database/connection");

const authRoutes = require("./routes/authRoutes");
const imoveisRoutes = require("./routes/imoveisRoutes");
const imoveisModel = require("./models/imoveisModel");

const app = express();
const PORT = process.env.PORT || 3000;

function obterPastaUploads() {
    const caminhoConfigurado = String(
        process.env.UPLOADS_PATH || "uploads/imoveis"
    ).trim();

    return path.isAbsolute(caminhoConfigurado)
        ? caminhoConfigurado
        : path.resolve(__dirname, caminhoConfigurado);
}

function prepararImagensLegadas(pastaUploads) {
    fs.mkdirSync(pastaUploads, { recursive: true });

    const pastaLegada = path.join(__dirname, "seed_uploads", "imoveis");

    if (!fs.existsSync(pastaLegada)) {
        return;
    }

    let copiadas = 0;

    for (const nomeArquivo of fs.readdirSync(pastaLegada)) {
        const origem = path.join(pastaLegada, nomeArquivo);
        const destino = path.join(pastaUploads, nomeArquivo);

        if (!fs.statSync(origem).isFile() || fs.existsSync(destino)) {
            continue;
        }

        fs.copyFileSync(origem, destino);
        copiadas += 1;
    }

    if (copiadas > 0) {
        console.log(`${copiadas} imagem(ns) antiga(s) copiadas para a pasta permanente.`);
    }
}

if (!process.env.SESSION_SECRET) {
    console.error("A variável SESSION_SECRET não foi configurada.");
    process.exit(1);
}

app.set("trust proxy", 1);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
    session({
        name: "tamura.sid",
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 8 * 60 * 60 * 1000
        }
    })
);

const pastaUploads = obterPastaUploads();
prepararImagensLegadas(pastaUploads);

app.use(
    "/uploads/imoveis",
    express.static(pastaUploads, {
        fallthrough: true,
        maxAge: process.env.NODE_ENV === "production" ? "7d" : 0
    })
);

// Arquivo de substituição para registros antigos cujo arquivo físico não existe.
app.get("/uploads/imoveis/:arquivo", (req, res) => {
    return res.sendFile(path.join(__dirname, "public", "fotos", "imagem-indisponivel.svg"));
});

// ===============================
// Sitemap para mecanismos de busca
// ===============================
app.get("/sitemap.xml", (req, res) => {
    const urlsFixas = [
        "https://tamuraimoveis.com/",
        "https://tamuraimoveis.com/paginas/comprar.html",
        "https://tamuraimoveis.com/paginas/alugar.html",
        "https://tamuraimoveis.com/paginas/contato.html"
    ];

    imoveisModel.listarTodos((erro, imoveis) => {
        if (erro) {
            console.error("Erro ao gerar sitemap:", erro);
            return res.status(500).type("text/plain").send("Erro ao gerar sitemap.");
        }

        const urlsImoveis = imoveis
            .filter((imovel) => imovel.status === "disponivel")
            .map((imovel) =>
                `https://tamuraimoveis.com/paginas/imovel.html?id=${encodeURIComponent(imovel.id)}`
            );

        const xmlUrls = [...urlsFixas, ...urlsImoveis]
            .map((url) => `  <url><loc>${url.replace(/&/g, "&amp;")}</loc></url>`)
            .join("\n");

        const xml =
            `<?xml version="1.0" encoding="UTF-8"?>\n` +
            `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
            `${xmlUrls}\n` +
            `</urlset>`;

        return res.type("application/xml").send(xml);
    });
});

app.use(express.static(path.join(__dirname, "public")));
app.use("/api/auth", authRoutes);
app.use("/api/imoveis", imoveisRoutes);

app.use("/api", (req, res) => {
    return res.status(404).json({ mensagem: "Rota da API não encontrada." });
});

app.use((erro, req, res, next) => {
    console.error("Erro não tratado:", erro);

    if (erro instanceof multer.MulterError) {
        const mensagens = {
            LIMIT_FILE_SIZE: "Uma das imagens ultrapassa o limite de 8 MB.",
            LIMIT_FILE_COUNT: "Selecione no máximo 15 imagens.",
            LIMIT_UNEXPECTED_FILE: "O campo de imagens enviado é inválido."
        };

        return res.status(400).json({
            mensagem: mensagens[erro.code] || "Erro ao processar as imagens enviadas."
        });
    }

    if (erro && erro.message && erro.message.includes("Formato de imagem inválido")) {
        return res.status(400).json({ mensagem: erro.message });
    }

    return res.status(500).json({
        mensagem: erro?.message || "Erro interno do servidor."
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log(`Pasta de uploads: ${pastaUploads}`);
});
