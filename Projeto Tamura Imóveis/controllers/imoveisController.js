const fs = require("fs");
const path = require("path");

const imoveisModel = require("../models/imoveisModel");
const prepararDadosImovel = require("../utils/prepararImovel");

// ===============================
// Configurações
// ===============================
const LIMITE_IMAGENS_POR_IMOVEL = 15;

// ===============================
// Formatação dos dados
// ===============================
function formatarMoeda(valor) {
    const valorNumerico = Number(valor);

    return valorNumerico.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

function primeiraLetraMaiuscula(texto) {
    if (!texto) {
        return "";
    }

    return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
}

function formatarArea(valor) {
    if (valor === null || valor === undefined) {
        return null;
    }

    const numero = Number(valor);

    const areaFormatada = Number.isInteger(numero)
        ? numero
        : numero.toString();

    return `${areaFormatada}m²`;
}

function formatarImovel(imovel, imagens) {
    const precoNumerico = Number(imovel.preco);

    return {
        id: imovel.id,
        titulo: imovel.titulo,
        destaque: Boolean(imovel.destaque),

        codigo: `REF: ${imovel.codigo}`,

        preco: formatarMoeda(precoNumerico),
        precoNumerico,

        endereco: imovel.endereco,
        bairro: imovel.bairro,
        cidade: imovel.cidade,
        estado: imovel.estado,

        status: imovel.status,

        quartos: imovel.quartos,
        suites: imovel.suites ?? 0,
        banheiros: imovel.banheiros,
        vagas: imovel.vagas,

        areaTerreno: formatarArea(imovel.area_terreno),
        areaConstruida: formatarArea(imovel.area_construida),

        tipo: imovel.tipo,
        finalidade: primeiraLetraMaiuscula(imovel.finalidade),

        imagens: imagens.map((imagem) => imagem.caminho_imagem),

        descricao: imovel.descricao
    };
}

// ===============================
// Validação de identificadores
// ===============================
function idValido(id) {
    return Number.isInteger(id) && id > 0;
}

// ===============================
// Remover arquivos enviados
// ===============================
function removerArquivosEnviados(arquivos = []) {
    arquivos.forEach((arquivo) => {
        fs.unlink(arquivo.path, (erro) => {
            if (erro && erro.code !== "ENOENT") {
                console.error(
                    "Erro ao remover imagem enviada:",
                    erro
                );
            }
        });
    });
}

// ===============================
// Remover arquivo físico
// ===============================
function removerArquivoFisico(caminhoImagem) {
    if (
        typeof caminhoImagem !== "string" ||
        !caminhoImagem.startsWith("/uploads/imoveis/")
    ) {
        return;
    }

    const nomeArquivo = path.basename(caminhoImagem);

    const caminhoConfigurado = String(
        process.env.UPLOADS_PATH || "uploads/imoveis"
    ).trim();

    const pastaUploads = path.isAbsolute(caminhoConfigurado)
        ? caminhoConfigurado
        : path.resolve(
            __dirname,
            "..",
            caminhoConfigurado
        );

    const caminhoFisico = path.join(
        pastaUploads,
        nomeArquivo
    );

    fs.unlink(caminhoFisico, (erro) => {
        if (erro && erro.code !== "ENOENT") {
            console.error(
                "Erro ao excluir arquivo físico:",
                erro
            );
        }
    });
}

// ===============================
// Listar imóveis
// ===============================
function listarImoveis(req, res) {
    imoveisModel.listarTodos((erroImoveis, imoveis) => {
        if (erroImoveis) {
            console.error(
                "Erro ao buscar imóveis:",
                erroImoveis
            );

            return res.status(500).json({
                mensagem: "Erro interno ao buscar os imóveis."
            });
        }

        imoveisModel.listarImagens((erroImagens, imagens) => {
            if (erroImagens) {
                console.error(
                    "Erro ao buscar imagens:",
                    erroImagens
                );

                return res.status(500).json({
                    mensagem:
                        "Erro interno ao buscar as imagens dos imóveis."
                });
            }

            const imoveisComImagens = imoveis.map((imovel) => {
                const imagensDoImovel = imagens.filter(
                    (imagem) => imagem.imovel_id === imovel.id
                );

                return formatarImovel(
                    imovel,
                    imagensDoImovel
                );
            });

            return res.status(200).json(
                imoveisComImagens
            );
        });
    });
}

// ===============================
// Buscar imóvel por ID
// ===============================
function buscarImovelPorId(req, res) {
    const id = Number(req.params.id);

    if (!idValido(id)) {
        return res.status(400).json({
            mensagem: "O ID informado é inválido."
        });
    }

    imoveisModel.buscarPorId(id, (erroImovel, resultados) => {
        if (erroImovel) {
            console.error(
                "Erro ao buscar imóvel:",
                erroImovel
            );

            return res.status(500).json({
                mensagem: "Erro interno ao buscar o imóvel."
            });
        }

        if (resultados.length === 0) {
            return res.status(404).json({
                mensagem: "Imóvel não encontrado."
            });
        }

        const imovel = resultados[0];

        imoveisModel.buscarImagensPorImovelId(id, (erroImagens, imagens) => {
            if (erroImagens) {
                console.error(
                    "Erro ao buscar imagens do imóvel:",
                    erroImagens
                );

                return res.status(500).json({
                    mensagem:
                        "Erro interno ao buscar as imagens do imóvel."
                });
            }

            return res.status(200).json(
                formatarImovel(imovel, imagens)
            );
        });
    });
}

// ===============================
// Listar imagens de um imóvel
// ===============================
function listarImagensDoImovel(req, res) {
    const id = Number(req.params.id);

    if (!idValido(id)) {
        return res.status(400).json({
            mensagem: "O ID informado é inválido."
        });
    }

    imoveisModel.buscarPorId(id, (erroImovel, resultados) => {
        if (erroImovel) {
            console.error(
                "Erro ao buscar imóvel:",
                erroImovel
            );

            return res.status(500).json({
                mensagem: "Erro interno ao buscar o imóvel."
            });
        }

        if (resultados.length === 0) {
            return res.status(404).json({
                mensagem: "Imóvel não encontrado."
            });
        }

        imoveisModel.buscarImagensPorImovelId(id, (erroImagens, imagens) => {
            if (erroImagens) {
                console.error(
                    "Erro ao buscar imagens do imóvel:",
                    erroImagens
                );

                return res.status(500).json({
                    mensagem:
                        "Erro interno ao buscar as imagens do imóvel."
                });
            }

            const imagensFormatadas = imagens.map((imagem) => ({
                id: imagem.id,
                caminho: imagem.caminho_imagem,
                ordem: imagem.ordem,
                principal: Boolean(imagem.imagem_principal)
            }));

            return res.status(200).json(
                imagensFormatadas
            );
        });
    });
}

// ===============================
// Cadastrar imóvel
// ===============================
function cadastrarImovel(req, res) {
    const arquivos = req.files || [];

    if (arquivos.length === 0) {
        return res.status(400).json({
            mensagem:
                "Selecione pelo menos uma imagem para o imóvel."
        });
    }

    let dadosImovel;

    try {
        dadosImovel = prepararDadosImovel(req.body);

    } catch (erro) {
        removerArquivosEnviados(arquivos);

        return res.status(erro.status || 400).json({
            mensagem: erro.message
        });
    }

    imoveisModel.cadastrarComImagens(dadosImovel, arquivos, (erro, resultado) => {
        if (erro) {
            removerArquivosEnviados(arquivos);

            console.error(
                "Erro ao cadastrar imóvel:",
                erro
            );

            if (erro.code === "ER_DUP_ENTRY") {
                return res.status(409).json({
                    mensagem:
                        "Já existe um imóvel com esse código."
                });
            }

            return res.status(500).json({
                mensagem:
                    "Erro interno ao cadastrar o imóvel."
            });
        }

        return res.status(201).json({
            mensagem:
                "Imóvel e imagens cadastrados com sucesso.",

            imovel: {
                id: resultado.insertId,
                ...dadosImovel,

                destaque:
                    Boolean(dadosImovel.destaque),

                imagens: arquivos.map(
                    (arquivo) =>
                        `/uploads/imoveis/${arquivo.filename}`
                )
            }
        });
    });
}

// ===============================
// Adicionar imagens ao imóvel
// ===============================
function adicionarImagensAoImovel(req, res) {
    const id = Number(req.params.id);
    const arquivos = req.files || [];

    if (!idValido(id)) {
        removerArquivosEnviados(arquivos);

        return res.status(400).json({
            mensagem: "O ID informado é inválido."
        });
    }

    if (arquivos.length === 0) {
        return res.status(400).json({
            mensagem:
                "Selecione pelo menos uma imagem para adicionar."
        });
    }

    imoveisModel.buscarPorId(id, (erroImovel, resultados) => {
        if (erroImovel) {
            removerArquivosEnviados(arquivos);

            console.error(
                "Erro ao buscar imóvel para adicionar imagens:",
                erroImovel
            );

            return res.status(500).json({
                mensagem: "Erro interno ao buscar o imóvel."
            });
        }

        if (resultados.length === 0) {
            removerArquivosEnviados(arquivos);

            return res.status(404).json({
                mensagem: "Imóvel não encontrado."
            });
        }

        imoveisModel.contarImagensPorImovelId(id, (erroContagem, totalAtual) => {
            if (erroContagem) {
                removerArquivosEnviados(arquivos);

                console.error(
                    "Erro ao contar imagens do imóvel:",
                    erroContagem
                );

                return res.status(500).json({
                    mensagem:
                        "Erro interno ao verificar as imagens do imóvel."
                });
            }

            const totalDepoisDoEnvio =
                totalAtual + arquivos.length;

            if (
                totalDepoisDoEnvio >
                LIMITE_IMAGENS_POR_IMOVEL
            ) {
                removerArquivosEnviados(arquivos);

                const quantidadeDisponivel =
                    LIMITE_IMAGENS_POR_IMOVEL - totalAtual;

                return res.status(400).json({
                    mensagem:
                        quantidadeDisponivel > 0
                            ? `Este imóvel permite adicionar no máximo mais ${quantidadeDisponivel} imagem(ns).`
                            : `Este imóvel já possui o limite máximo de ${LIMITE_IMAGENS_POR_IMOVEL} imagens.`
                });
            }

            imoveisModel.adicionarImagens(id, arquivos, (erroAdicao, resultado) => {
                if (erroAdicao) {
                    removerArquivosEnviados(arquivos);

                    console.error(
                        "Erro ao adicionar imagens ao imóvel:",
                        erroAdicao
                    );

                    return res.status(500).json({
                        mensagem:
                            "Erro interno ao adicionar as imagens."
                    });
                }

                return res.status(201).json({
                    mensagem:
                        `${resultado.quantidade} imagem(ns) adicionada(s) com sucesso.`
                });
            });
        });
    });
}

// ===============================
// Definir imagem principal
// ===============================
function definirImagemPrincipal(req, res) {
    const imovelId = Number(req.params.id);
    const imagemId = Number(req.params.imagemId);

    if (
        !idValido(imovelId) ||
        !idValido(imagemId)
    ) {
        return res.status(400).json({
            mensagem:
                "O identificador do imóvel ou da imagem é inválido."
        });
    }

    imoveisModel.definirImagemPrincipal(
        imovelId,
        imagemId,
        (erro) => {
            if (erro) {
                if (
                    erro.code ===
                    "IMAGEM_NAO_ENCONTRADA"
                ) {
                    return res.status(404).json({
                        mensagem: erro.message
                    });
                }

                console.error(
                    "Erro ao definir imagem principal:",
                    erro
                );

                return res.status(500).json({
                    mensagem:
                        "Erro interno ao definir a imagem principal."
                });
            }

            return res.status(200).json({
                mensagem:
                    "Imagem principal definida com sucesso."
            });
        }
    );
}

// ===============================
// Excluir imagem
// ===============================
function excluirImagemDoImovel(req, res) {
    const imovelId = Number(req.params.id);
    const imagemId = Number(req.params.imagemId);

    if (
        !idValido(imovelId) ||
        !idValido(imagemId)
    ) {
        return res.status(400).json({
            mensagem:
                "O identificador do imóvel ou da imagem é inválido."
        });
    }

    imoveisModel.excluirImagemComReorganizacao(
        imovelId,
        imagemId,
        (erro, resultado) => {
            if (erro) {
                if (
                    erro.code ===
                    "IMAGEM_NAO_ENCONTRADA"
                ) {
                    return res.status(404).json({
                        mensagem: erro.message
                    });
                }

                if (erro.code === "ULTIMA_IMAGEM") {
                    return res.status(400).json({
                        mensagem: erro.message
                    });
                }

                console.error(
                    "Erro ao excluir imagem:",
                    erro
                );

                return res.status(500).json({
                    mensagem:
                        "Erro interno ao excluir a imagem."
                });
            }

            removerArquivoFisico(
                resultado.imagemExcluida.caminho_imagem
            );

            return res.status(200).json({
                mensagem:
                    "Imagem excluída com sucesso."
            });
        }
    );
}

// ===============================
// Atualizar ordem das imagens
// ===============================
function atualizarOrdemDasImagens(req, res) {
    const imovelId = Number(req.params.id);
    const imagens = req.body.imagens;

    if (!idValido(imovelId)) {
        return res.status(400).json({
            mensagem: "O ID informado é inválido."
        });
    }

    if (
        !Array.isArray(imagens) ||
        imagens.length === 0
    ) {
        return res.status(400).json({
            mensagem:
                "Informe a ordem completa das imagens."
        });
    }

    const ids = imagens.map(
        (imagem) => Number(imagem.id)
    );

    const todosIdsValidos = ids.every(
        (id) => idValido(id)
    );

    if (!todosIdsValidos) {
        return res.status(400).json({
            mensagem:
                "A lista contém identificadores de imagens inválidos."
        });
    }

    const idsSemDuplicacao = new Set(ids);

    if (idsSemDuplicacao.size !== ids.length) {
        return res.status(400).json({
            mensagem:
                "A lista contém imagens duplicadas."
        });
    }

    const imagensFormatadas = ids.map(
        (id) => ({ id })
    );

    imoveisModel.atualizarOrdemDasImagens(
        imovelId,
        imagensFormatadas,
        (erro, resultado) => {
            if (erro) {
                if (erro.code === "ORDEM_INVALIDA") {
                    return res.status(400).json({
                        mensagem: erro.message
                    });
                }

                console.error(
                    "Erro ao atualizar ordem das imagens:",
                    erro
                );

                return res.status(500).json({
                    mensagem:
                        "Erro interno ao atualizar a ordem das imagens."
                });
            }

            return res.status(200).json({
                mensagem:
                    `${resultado.quantidade} imagem(ns) reorganizada(s) com sucesso.`
            });
        }
    );
}

// ===============================
// Atualizar imóvel
// ===============================
function atualizarImovel(req, res) {
    const id = Number(req.params.id);

    if (!idValido(id)) {
        return res.status(400).json({
            mensagem: "O ID informado é inválido."
        });
    }

    let dadosImovel;

    try {
        dadosImovel = prepararDadosImovel(req.body);

    } catch (erro) {
        return res.status(erro.status || 400).json({
            mensagem: erro.message
        });
    }

    imoveisModel.atualizarPorId(id, dadosImovel, (erro, resultado) => {
        if (erro) {
            console.error(
                "Erro ao atualizar imóvel:",
                erro
            );

            if (erro.code === "ER_DUP_ENTRY") {
                return res.status(409).json({
                    mensagem:
                        "Já existe outro imóvel com esse código."
                });
            }

            return res.status(500).json({
                mensagem:
                    "Erro interno ao atualizar o imóvel."
            });
        }

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensagem: "Imóvel não encontrado."
            });
        }

        return res.status(200).json({
            mensagem:
                "Imóvel atualizado com sucesso."
        });
    });
}

// ===============================
// Excluir imóvel
// ===============================
function excluirImovel(req, res) {
    const id = Number(req.params.id);

    if (!idValido(id)) {
        return res.status(400).json({
            mensagem: "O ID informado é inválido."
        });
    }

    imoveisModel.buscarPorId(id, (erroImovel, resultados) => {
        if (erroImovel) {
            console.error(
                "Erro ao buscar imóvel para exclusão:",
                erroImovel
            );

            return res.status(500).json({
                mensagem: "Erro interno ao buscar o imóvel."
            });
        }

        if (resultados.length === 0) {
            return res.status(404).json({
                mensagem: "Imóvel não encontrado."
            });
        }

        imoveisModel.buscarImagensPorImovelId(id, (erroImagens, imagens) => {
            if (erroImagens) {
                console.error(
                    "Erro ao buscar imagens para exclusão:",
                    erroImagens
                );

                return res.status(500).json({
                    mensagem:
                        "Erro interno ao buscar as imagens do imóvel."
                });
            }

            imoveisModel.excluirPorId(id, (erroExclusao, resultado) => {
                if (erroExclusao) {
                    console.error(
                        "Erro ao excluir imóvel:",
                        erroExclusao
                    );

                    return res.status(500).json({
                        mensagem:
                            "Erro interno ao excluir o imóvel."
                    });
                }

                if (resultado.affectedRows === 0) {
                    return res.status(404).json({
                        mensagem: "Imóvel não encontrado."
                    });
                }

                imagens.forEach((imagem) => {
                    removerArquivoFisico(
                        imagem.caminho_imagem
                    );
                });

                return res.status(200).json({
                    mensagem:
                        "Imóvel excluído com sucesso."
                });
            });
        });
    });
}

// ===============================
// Exportações
// ===============================
module.exports = {
    listarImoveis,
    buscarImovelPorId,
    listarImagensDoImovel,
    cadastrarImovel,
    adicionarImagensAoImovel,
    definirImagemPrincipal,
    excluirImagemDoImovel,
    atualizarOrdemDasImagens,
    atualizarImovel,
    excluirImovel
};
