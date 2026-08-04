require("dotenv").config();

const mysql = require("mysql2");

const variaveisObrigatorias = [
    "DB_HOST",
    "DB_USER",
    "DB_PASSWORD",
    "DB_NAME",
    "DB_PORT"
];

for (const variavel of variaveisObrigatorias) {
    if (!String(process.env[variavel] || "").trim()) {
        console.error(`A variável ${variavel} não foi configurada.`);
        process.exit(1);
    }
}

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: "utf8mb4"
});

// Adaptador compatível com o model existente. Durante uma transação,
// todas as consultas usam a mesma conexão reservada do pool.
let conexaoTransacao = null;
let transacaoEmUso = false;

function query(sql, valores, callback) {
    if (typeof valores === "function") {
        callback = valores;
        valores = undefined;
    }

    const executor = conexaoTransacao || pool;

    return valores === undefined
        ? executor.query(sql, callback)
        : executor.query(sql, valores, callback);
}

function beginTransaction(callback) {
    if (transacaoEmUso) {
        const erro = new Error("Já existe uma transação administrativa em andamento.");
        erro.code = "TRANSACAO_EM_USO";
        return process.nextTick(() => callback(erro));
    }

    transacaoEmUso = true;

    pool.getConnection((erroConexao, conexao) => {
        if (erroConexao) {
            transacaoEmUso = false;
            return callback(erroConexao);
        }

        conexaoTransacao = conexao;

        conexao.beginTransaction((erroTransacao) => {
            if (erroTransacao) {
                conexao.release();
                conexaoTransacao = null;
                transacaoEmUso = false;
            }

            return callback(erroTransacao);
        });
    });
}

function finalizarTransacao(metodo, callback) {
    if (!conexaoTransacao) {
        const erro = new Error("Nenhuma transação ativa.");
        erro.code = "SEM_TRANSACAO";
        return process.nextTick(() => callback && callback(erro));
    }

    const conexao = conexaoTransacao;

    conexao[metodo]((erro) => {
        conexao.release();
        conexaoTransacao = null;
        transacaoEmUso = false;

        if (callback) {
            callback(erro);
        }
    });
}

function commit(callback) {
    finalizarTransacao("commit", callback);
}

function rollback(callback) {
    finalizarTransacao("rollback", callback);
}

pool.getConnection((erro, conexao) => {
    if (erro) {
        console.error("Erro ao conectar ao banco de dados MySQL:");
        console.error(erro.message);
        process.exit(1);
    }

    console.log("Conectado ao banco de dados MySQL com sucesso!");
    conexao.release();
});

module.exports = {
    query,
    beginTransaction,
    commit,
    rollback,
    getConnection: pool.getConnection.bind(pool),
    end: pool.end.bind(pool)
};
