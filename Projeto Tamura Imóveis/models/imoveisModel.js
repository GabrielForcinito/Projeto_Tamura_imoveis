const connection = require("../database/connection");

// ===============================
// Executar atualizações em sequência
// ===============================
function executarAtualizacoesEmSequencia(atualizacoes, indice, callback) {
    if (indice >= atualizacoes.length) {
        return callback(null);
    }

    const atualizacao = atualizacoes[indice];

    connection.query(
        atualizacao.sql,
        atualizacao.valores,
        (erro) => {
            if (erro) {
                return callback(erro);
            }

            executarAtualizacoesEmSequencia(
                atualizacoes,
                indice + 1,
                callback
            );
        }
    );
}

// ===============================
// Listar todos os imóveis
// ===============================
function listarTodos(callback) {
    const sql = `
        SELECT *
        FROM imoveis
        ORDER BY id
    `;

    connection.query(sql, callback);
}

// ===============================
// Buscar imóvel por ID
// ===============================
function buscarPorId(id, callback) {
    const sql = `
        SELECT *
        FROM imoveis
        WHERE id = ?
    `;

    connection.query(sql, [id], callback);
}

// ===============================
// Listar todas as imagens
// ===============================
function listarImagens(callback) {
    const sql = `
        SELECT
            id,
            imovel_id,
            caminho_imagem,
            ordem,
            imagem_principal
        FROM imagens_imoveis
        ORDER BY imovel_id, ordem, id
    `;

    connection.query(sql, callback);
}

// ===============================
// Buscar imagens de um imóvel
// ===============================
function buscarImagensPorImovelId(imovelId, callback) {
    const sql = `
        SELECT
            id,
            imovel_id,
            caminho_imagem,
            ordem,
            imagem_principal
        FROM imagens_imoveis
        WHERE imovel_id = ?
        ORDER BY ordem, id
    `;

    connection.query(sql, [imovelId], callback);
}

// ===============================
// Buscar imagem por ID
// ===============================
function buscarImagemPorId(imovelId, imagemId, callback) {
    const sql = `
        SELECT
            id,
            imovel_id,
            caminho_imagem,
            ordem,
            imagem_principal
        FROM imagens_imoveis
        WHERE id = ?
        AND imovel_id = ?
    `;

    connection.query(
        sql,
        [imagemId, imovelId],
        callback
    );
}

// ===============================
// Contar imagens do imóvel
// ===============================
function contarImagensPorImovelId(imovelId, callback) {
    const sql = `
        SELECT COUNT(*) AS total
        FROM imagens_imoveis
        WHERE imovel_id = ?
    `;

    connection.query(
        sql,
        [imovelId],
        (erro, resultados) => {
            if (erro) {
                return callback(erro);
            }

            const total = Number(
                resultados[0]?.total || 0
            );

            return callback(null, total);
        }
    );
}

// ===============================
// Buscar maior ordem
// ===============================
function buscarMaiorOrdem(imovelId, callback) {
    const sql = `
        SELECT COALESCE(MAX(ordem), 0) AS maior_ordem
        FROM imagens_imoveis
        WHERE imovel_id = ?
    `;

    connection.query(
        sql,
        [imovelId],
        (erro, resultados) => {
            if (erro) {
                return callback(erro);
            }

            const maiorOrdem = Number(
                resultados[0]?.maior_ordem || 0
            );

            return callback(null, maiorOrdem);
        }
    );
}

// ===============================
// Cadastrar imóvel com imagens
// ===============================
function cadastrarComImagens(dadosImovel, arquivos, callback) {
    connection.beginTransaction((erroTransacao) => {
        if (erroTransacao) {
            return callback(erroTransacao);
        }

        const sqlImovel = `
            INSERT INTO imoveis (
                titulo,
                codigo,
                tipo,
                finalidade,
                status,
                preco,
                endereco,
                bairro,
                cidade,
                estado,
                quartos,
                suites,
                banheiros,
                vagas,
                area_terreno,
                area_construida,
                descricao,
                destaque
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const valoresImovel = [
            dadosImovel.titulo,
            dadosImovel.codigo,
            dadosImovel.tipo,
            dadosImovel.finalidade,
            dadosImovel.status,
            dadosImovel.preco,
            dadosImovel.endereco,
            dadosImovel.bairro,
            dadosImovel.cidade,
            dadosImovel.estado,
            dadosImovel.quartos,
            dadosImovel.suites,
            dadosImovel.banheiros,
            dadosImovel.vagas,
            dadosImovel.areaTerreno,
            dadosImovel.areaConstruida,
            dadosImovel.descricao,
            dadosImovel.destaque
        ];

        connection.query(
            sqlImovel,
            valoresImovel,
            (erroImovel, resultadoImovel) => {
                if (erroImovel) {
                    return connection.rollback(
                        () => callback(erroImovel)
                    );
                }

                const imovelId = resultadoImovel.insertId;

                const valoresImagens = arquivos.map(
                    (arquivo, indice) => [
                        imovelId,
                        `/uploads/imoveis/${arquivo.filename}`,
                        indice + 1,
                        indice === 0 ? 1 : 0
                    ]
                );

                const sqlImagens = `
                    INSERT INTO imagens_imoveis (
                        imovel_id,
                        caminho_imagem,
                        ordem,
                        imagem_principal
                    )
                    VALUES ?
                `;

                connection.query(
                    sqlImagens,
                    [valoresImagens],
                    (erroImagens) => {
                        if (erroImagens) {
                            return connection.rollback(
                                () => callback(erroImagens)
                            );
                        }

                        connection.commit((erroCommit) => {
                            if (erroCommit) {
                                return connection.rollback(
                                    () => callback(erroCommit)
                                );
                            }

                            return callback(null, {
                                insertId: imovelId
                            });
                        });
                    }
                );
            }
        );
    });
}

// ===============================
// Adicionar imagens ao imóvel
// ===============================
function adicionarImagens(imovelId, arquivos, callback) {
    connection.beginTransaction((erroTransacao) => {
        if (erroTransacao) {
            return callback(erroTransacao);
        }

        const sqlMaiorOrdem = `
            SELECT COALESCE(MAX(ordem), 0) AS maior_ordem
            FROM imagens_imoveis
            WHERE imovel_id = ?
            FOR UPDATE
        `;

        connection.query(
            sqlMaiorOrdem,
            [imovelId],
            (erroOrdem, resultados) => {
                if (erroOrdem) {
                    return connection.rollback(
                        () => callback(erroOrdem)
                    );
                }

                const maiorOrdem = Number(
                    resultados[0]?.maior_ordem || 0
                );

                const valoresImagens = arquivos.map(
                    (arquivo, indice) => [
                        imovelId,
                        `/uploads/imoveis/${arquivo.filename}`,
                        maiorOrdem + indice + 1,
                        maiorOrdem === 0 && indice === 0 ? 1 : 0
                    ]
                );

                const sqlImagens = `
                    INSERT INTO imagens_imoveis (
                        imovel_id,
                        caminho_imagem,
                        ordem,
                        imagem_principal
                    )
                    VALUES ?
                `;

                connection.query(
                    sqlImagens,
                    [valoresImagens],
                    (erroImagens, resultado) => {
                        if (erroImagens) {
                            return connection.rollback(
                                () => callback(erroImagens)
                            );
                        }

                        connection.commit((erroCommit) => {
                            if (erroCommit) {
                                return connection.rollback(
                                    () => callback(erroCommit)
                                );
                            }

                            return callback(null, {
                                quantidade: resultado.affectedRows
                            });
                        });
                    }
                );
            }
        );
    });
}

// ===============================
// Definir imagem principal
// ===============================
function definirImagemPrincipal(imovelId, imagemId, callback) {
    connection.beginTransaction((erroTransacao) => {
        if (erroTransacao) {
            return callback(erroTransacao);
        }

        const sqlImagens = `
            SELECT
                id,
                ordem
            FROM imagens_imoveis
            WHERE imovel_id = ?
            ORDER BY ordem, id
            FOR UPDATE
        `;

        connection.query(
            sqlImagens,
            [imovelId],
            (erroImagens, imagens) => {
                if (erroImagens) {
                    return connection.rollback(
                        () => callback(erroImagens)
                    );
                }

                const imagemSelecionada = imagens.find(
                    (imagem) => imagem.id === imagemId
                );

                if (!imagemSelecionada) {
                    const erro = new Error(
                        "Imagem não encontrada para este imóvel."
                    );

                    erro.code = "IMAGEM_NAO_ENCONTRADA";

                    return connection.rollback(
                        () => callback(erro)
                    );
                }

                const imagensOrdenadas = [
                    imagemSelecionada,
                    ...imagens.filter(
                        (imagem) => imagem.id !== imagemId
                    )
                ];

                const atualizacoes = imagensOrdenadas.map(
                    (imagem, indice) => ({
                        sql: `
                            UPDATE imagens_imoveis
                            SET
                                ordem = ?,
                                imagem_principal = ?
                            WHERE id = ?
                            AND imovel_id = ?
                        `,

                        valores: [
                            indice + 1,
                            indice === 0 ? 1 : 0,
                            imagem.id,
                            imovelId
                        ]
                    })
                );

                executarAtualizacoesEmSequencia(
                    atualizacoes,
                    0,
                    (erroAtualizacao) => {
                        if (erroAtualizacao) {
                            return connection.rollback(
                                () => callback(erroAtualizacao)
                            );
                        }

                        connection.commit((erroCommit) => {
                            if (erroCommit) {
                                return connection.rollback(
                                    () => callback(erroCommit)
                                );
                            }

                            return callback(null, {
                                imagemId
                            });
                        });
                    }
                );
            }
        );
    });
}

// ===============================
// Excluir imagem e reorganizar
// ===============================
function excluirImagemComReorganizacao(imovelId, imagemId, callback) {
    connection.beginTransaction((erroTransacao) => {
        if (erroTransacao) {
            return callback(erroTransacao);
        }

        const sqlImagens = `
            SELECT
                id,
                imovel_id,
                caminho_imagem,
                ordem,
                imagem_principal
            FROM imagens_imoveis
            WHERE imovel_id = ?
            ORDER BY ordem, id
            FOR UPDATE
        `;

        connection.query(
            sqlImagens,
            [imovelId],
            (erroImagens, imagens) => {
                if (erroImagens) {
                    return connection.rollback(
                        () => callback(erroImagens)
                    );
                }

                const imagemSelecionada = imagens.find(
                    (imagem) => imagem.id === imagemId
                );

                if (!imagemSelecionada) {
                    const erro = new Error(
                        "Imagem não encontrada para este imóvel."
                    );

                    erro.code = "IMAGEM_NAO_ENCONTRADA";

                    return connection.rollback(
                        () => callback(erro)
                    );
                }

                if (imagens.length <= 1) {
                    const erro = new Error(
                        "O imóvel precisa permanecer com pelo menos uma imagem."
                    );

                    erro.code = "ULTIMA_IMAGEM";

                    return connection.rollback(
                        () => callback(erro)
                    );
                }

                const sqlExcluir = `
                    DELETE FROM imagens_imoveis
                    WHERE id = ?
                    AND imovel_id = ?
                `;

                connection.query(
                    sqlExcluir,
                    [imagemId, imovelId],
                    (erroExclusao) => {
                        if (erroExclusao) {
                            return connection.rollback(
                                () => callback(erroExclusao)
                            );
                        }

                        const imagensRestantes = imagens.filter(
                            (imagem) => imagem.id !== imagemId
                        );

                        const principalRestante =
                            imagensRestantes.find(
                                (imagem) =>
                                    Boolean(imagem.imagem_principal)
                            );

                        const idPrincipal =
                            principalRestante?.id ||
                            imagensRestantes[0].id;

                        const imagensOrdenadas = [
                            imagensRestantes.find(
                                (imagem) => imagem.id === idPrincipal
                            ),

                            ...imagensRestantes.filter(
                                (imagem) => imagem.id !== idPrincipal
                            )
                        ];

                        const atualizacoes = imagensOrdenadas.map(
                            (imagem, indice) => ({
                                sql: `
                                    UPDATE imagens_imoveis
                                    SET
                                        ordem = ?,
                                        imagem_principal = ?
                                    WHERE id = ?
                                    AND imovel_id = ?
                                `,

                                valores: [
                                    indice + 1,
                                    indice === 0 ? 1 : 0,
                                    imagem.id,
                                    imovelId
                                ]
                            })
                        );

                        executarAtualizacoesEmSequencia(
                            atualizacoes,
                            0,
                            (erroAtualizacao) => {
                                if (erroAtualizacao) {
                                    return connection.rollback(
                                        () => callback(erroAtualizacao)
                                    );
                                }

                                connection.commit((erroCommit) => {
                                    if (erroCommit) {
                                        return connection.rollback(
                                            () => callback(erroCommit)
                                        );
                                    }

                                    return callback(null, {
                                        imagemExcluida:
                                            imagemSelecionada
                                    });
                                });
                            }
                        );
                    }
                );
            }
        );
    });
}

// ===============================
// Atualizar ordem das imagens
// ===============================
function atualizarOrdemDasImagens(imovelId, imagens, callback) {
    connection.beginTransaction((erroTransacao) => {
        if (erroTransacao) {
            return callback(erroTransacao);
        }

        const sqlImagensAtuais = `
            SELECT
                id,
                imagem_principal
            FROM imagens_imoveis
            WHERE imovel_id = ?
            ORDER BY ordem, id
            FOR UPDATE
        `;

        connection.query(
            sqlImagensAtuais,
            [imovelId],
            (erroImagens, imagensAtuais) => {
                if (erroImagens) {
                    return connection.rollback(
                        () => callback(erroImagens)
                    );
                }

                const idsAtuais = imagensAtuais
                    .map((imagem) => imagem.id)
                    .sort((a, b) => a - b);

                const idsRecebidos = imagens
                    .map((imagem) => imagem.id)
                    .sort((a, b) => a - b);

                const listaValida =
                    idsAtuais.length === idsRecebidos.length &&
                    idsAtuais.every(
                        (id, indice) => id === idsRecebidos[indice]
                    );

                if (!listaValida) {
                    const erro = new Error(
                        "A lista de imagens informada é inválida."
                    );

                    erro.code = "ORDEM_INVALIDA";

                    return connection.rollback(
                        () => callback(erro)
                    );
                }

                const imagemPrincipal = imagensAtuais.find(
                    (imagem) => Boolean(imagem.imagem_principal)
                );

                const idPrincipal =
                    imagemPrincipal?.id ||
                    imagens[0]?.id;

                const atualizacoes = imagens.map(
                    (imagem, indice) => ({
                        sql: `
                            UPDATE imagens_imoveis
                            SET
                                ordem = ?,
                                imagem_principal = ?
                            WHERE id = ?
                            AND imovel_id = ?
                        `,

                        valores: [
                            indice + 1,
                            imagem.id === idPrincipal ? 1 : 0,
                            imagem.id,
                            imovelId
                        ]
                    })
                );

                executarAtualizacoesEmSequencia(
                    atualizacoes,
                    0,
                    (erroAtualizacao) => {
                        if (erroAtualizacao) {
                            return connection.rollback(
                                () => callback(erroAtualizacao)
                            );
                        }

                        connection.commit((erroCommit) => {
                            if (erroCommit) {
                                return connection.rollback(
                                    () => callback(erroCommit)
                                );
                            }

                            return callback(null, {
                                quantidade: imagens.length
                            });
                        });
                    }
                );
            }
        );
    });
}

// ===============================
// Atualizar imóvel por ID
// ===============================
function atualizarPorId(id, dadosImovel, callback) {
    const sql = `
        UPDATE imoveis
        SET
            titulo = ?,
            codigo = ?,
            tipo = ?,
            finalidade = ?,
            status = ?,
            preco = ?,
            endereco = ?,
            bairro = ?,
            cidade = ?,
            estado = ?,
            quartos = ?,
            suites = ?,
            banheiros = ?,
            vagas = ?,
            area_terreno = ?,
            area_construida = ?,
            descricao = ?,
            destaque = ?
        WHERE id = ?
    `;

    const valores = [
        dadosImovel.titulo,
        dadosImovel.codigo,
        dadosImovel.tipo,
        dadosImovel.finalidade,
        dadosImovel.status,
        dadosImovel.preco,
        dadosImovel.endereco,
        dadosImovel.bairro,
        dadosImovel.cidade,
        dadosImovel.estado,
        dadosImovel.quartos,
        dadosImovel.suites,
        dadosImovel.banheiros,
        dadosImovel.vagas,
        dadosImovel.areaTerreno,
        dadosImovel.areaConstruida,
        dadosImovel.descricao,
        dadosImovel.destaque,
        id
    ];

    connection.query(sql, valores, callback);
}

// ===============================
// Excluir imóvel por ID
// ===============================
function excluirPorId(id, callback) {
    const sql = `
        DELETE FROM imoveis
        WHERE id = ?
    `;

    connection.query(sql, [id], callback);
}

// ===============================
// Exportações
// ===============================
module.exports = {
    listarTodos,
    buscarPorId,
    listarImagens,
    buscarImagensPorImovelId,
    buscarImagemPorId,
    contarImagensPorImovelId,
    buscarMaiorOrdem,
    cadastrarComImagens,
    adicionarImagens,
    definirImagemPrincipal,
    excluirImagemComReorganizacao,
    atualizarOrdemDasImagens,
    atualizarPorId,
    excluirPorId
};
