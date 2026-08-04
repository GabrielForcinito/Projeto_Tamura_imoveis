async function buscarTodosImoveis() {
    const resposta = await fetch("/api/imoveis");

    if (!resposta.ok) {
        throw new Error("Não foi possível carregar os imóveis.");
    }

    return await resposta.json();
}

async function buscarImovelPorId(id) {
    const resposta = await fetch(`/api/imoveis/${id}`);

    if (!resposta.ok) {
        throw new Error("Não foi possível carregar o imóvel.");
    }

    return await resposta.json();
}
