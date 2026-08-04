// ===============================
// Valores permitidos
// ===============================
const FINALIDADES_PERMITIDAS = [
    "venda",
    "aluguel"
];

const STATUS_PERMITIDOS = [
    "disponivel",
    "vendido",
    "alugado",
    "reservado"
];

// ===============================
// Criar erro de validação
// ===============================
function criarErroValidacao(mensagem) {
    const erro = new Error(mensagem);

    erro.status = 400;

    return erro;
}

// ===============================
// Verificar texto vazio
// ===============================
function textoVazio(valor) {
    return (
        typeof valor !== "string" ||
        valor.trim() === ""
    );
}

// ===============================
// Converter número opcional
// ===============================
function converterNumeroOpcional(valor) {
    if (
        valor === "" ||
        valor === null ||
        valor === undefined
    ) {
        return null;
    }

    return Number(valor);
}

// ===============================
// Verificar número inteiro válido
// ===============================
function inteiroNaoNegativo(valor) {
    return (
        Number.isInteger(valor) &&
        valor >= 0
    );
}

// ===============================
// Preparar dados do imóvel
// ===============================
function prepararDadosImovel(dados) {
    const {
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
        areaTerreno,
        areaConstruida,
        descricao,
        destaque
    } = dados;

    // ===============================
    // Campos obrigatórios
    // ===============================
    if (
        textoVazio(titulo) ||
        textoVazio(codigo) ||
        textoVazio(tipo) ||
        textoVazio(finalidade) ||
        textoVazio(status) ||
        preco === undefined ||
        preco === null ||
        preco === "" ||
        textoVazio(endereco) ||
        textoVazio(bairro) ||
        textoVazio(cidade) ||
        textoVazio(estado) ||
        quartos === undefined ||
        quartos === null ||
        quartos === "" ||
        banheiros === undefined ||
        banheiros === null ||
        banheiros === "" ||
        vagas === undefined ||
        vagas === null ||
        vagas === "" ||
        textoVazio(descricao)
    ) {
        throw criarErroValidacao(
            "Preencha todos os campos obrigatórios."
        );
    }

    // ===============================
    // Normalização dos textos
    // ===============================
    const finalidadeNormalizada =
        finalidade.trim().toLowerCase();

    const statusNormalizado =
        status.trim().toLowerCase();

    // ===============================
    // Valores permitidos
    // ===============================
    if (!FINALIDADES_PERMITIDAS.includes(finalidadeNormalizada)) {
        throw criarErroValidacao(
            "A finalidade informada é inválida."
        );
    }

    if (!STATUS_PERMITIDOS.includes(statusNormalizado)) {
        throw criarErroValidacao(
            "O status informado é inválido."
        );
    }

    // ===============================
    // Conversões numéricas
    // ===============================
    const precoNumerico = Number(preco);
    const quartosNumerico = Number(quartos);

    const suitesNumerico =
        suites === "" ||
        suites === null ||
        suites === undefined
            ? 0
            : Number(suites);

    const banheirosNumerico = Number(banheiros);
    const vagasNumerico = Number(vagas);

    const areaTerrenoNumerica =
        converterNumeroOpcional(areaTerreno);

    const areaConstruidaNumerica =
        converterNumeroOpcional(areaConstruida);

    // ===============================
    // Validação dos números principais
    // ===============================
    if (
        !Number.isFinite(precoNumerico) ||
        precoNumerico < 0 ||
        !inteiroNaoNegativo(quartosNumerico) ||
        !inteiroNaoNegativo(suitesNumerico) ||
        !inteiroNaoNegativo(banheirosNumerico) ||
        !inteiroNaoNegativo(vagasNumerico)
    ) {
        throw criarErroValidacao(
            "Os valores numéricos informados são inválidos."
        );
    }

    // ===============================
    // Validação das áreas
    // ===============================
    if (
        areaTerrenoNumerica !== null &&
        (
            !Number.isFinite(areaTerrenoNumerica) ||
            areaTerrenoNumerica < 0
        )
    ) {
        throw criarErroValidacao(
            "A área do terreno informada é inválida."
        );
    }

    if (
        areaConstruidaNumerica !== null &&
        (
            !Number.isFinite(areaConstruidaNumerica) ||
            areaConstruidaNumerica < 0
        )
    ) {
        throw criarErroValidacao(
            "A área construída informada é inválida."
        );
    }

    // ===============================
    // Estado
    // ===============================
    const estadoNormalizado =
        estado.trim().toUpperCase();

    if (estadoNormalizado.length !== 2) {
        throw criarErroValidacao(
            "Informe o estado utilizando uma sigla com duas letras."
        );
    }

    // ===============================
    // Dados normalizados
    // ===============================
    return {
        titulo: titulo.trim(),

        codigo: codigo
            .replace(/^REF:\s*/i, "")
            .trim()
            .toUpperCase(),

        tipo: tipo.trim(),

        finalidade: finalidadeNormalizada,
        status: statusNormalizado,
        preco: precoNumerico,

        endereco: endereco.trim(),
        bairro: bairro.trim(),
        cidade: cidade.trim(),
        estado: estadoNormalizado,

        quartos: quartosNumerico,
        suites: suitesNumerico,
        banheiros: banheirosNumerico,
        vagas: vagasNumerico,

        areaTerreno: areaTerrenoNumerica,
        areaConstruida: areaConstruidaNumerica,

        descricao: descricao.trim(),

        destaque:
            destaque === true ||
            destaque === 1 ||
            destaque === "1"
                ? 1
                : 0
    };
}

module.exports = prepararDadosImovel;
