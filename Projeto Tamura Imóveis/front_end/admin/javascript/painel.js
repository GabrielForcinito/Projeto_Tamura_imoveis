(() => {

    // ===============================
    // Elementos
    // ===============================
    const corpoTabela =
        document.getElementById("corpo-tabela");

    const mensagemPainel =
        document.getElementById("mensagem-painel");

    const btnSair =
        document.getElementById("btn-sair");

    // ===============================
    // Formatação
    // ===============================
    function formatarStatus(status) {
        const statusMapeado = {
            disponivel: {
                texto: "Disponível",
                classe: "status-disponivel"
            },

            vendido: {
                texto: "Vendido",
                classe: "status-vendido"
            },

            reservado: {
                texto: "Reservado",
                classe: "status-reservado"
            },

            alugado: {
                texto: "Alugado",
                classe: "status-alugado"
            }
        };

        return statusMapeado[status] || {
            texto: "Indefinido",
            classe: ""
        };
    }

    // ===============================
    // Gerar linha da tabela
    // ===============================
    function gerarLinhaImovel(imovel) {
        const status =
            formatarStatus(imovel.status);

        const imagemPrincipal =
            imovel.imagens.length > 0
                ? imovel.imagens[0]
                : "";

        return `
            <tr class="linha-imovel">
                <td
                    class="coluna-imagem"
                    data-label="Imagem"
                >
                    ${
                        imagemPrincipal
                            ? `
                                <img
                                    src="${imagemPrincipal}"
                                    alt="${imovel.titulo}"
                                    class="imagem-tabela"
                                >
                            `
                            : `
                                <span class="sem-imagem-tabela">
                                    Sem imagem
                                </span>
                            `
                    }
                </td>

                <td
                    class="coluna-codigo"
                    data-label="Código"
                >
                    ${imovel.codigo}
                </td>

                <td
                    class="coluna-titulo"
                    data-label="Título"
                >
                    ${imovel.titulo}
                </td>

                <td
                    class="coluna-tipo"
                    data-label="Tipo"
                >
                    ${imovel.tipo}
                </td>

                <td
                    class="coluna-finalidade"
                    data-label="Finalidade"
                >
                    ${imovel.finalidade}
                </td>

                <td
                    class="coluna-preco"
                    data-label="Preço"
                >
                    ${imovel.preco}
                </td>

                <td
                    class="coluna-status"
                    data-label="Status"
                >
                    <span class="status ${status.classe}">
                        ${status.texto}
                    </span>
                </td>

                <td
                    class="coluna-acoes"
                    data-label="Ações"
                >
                    <div class="acoes">
                        <button
                            type="button"
                            class="btn-acao btn-editar"
                            data-id="${imovel.id}"
                        >
                            Editar
                        </button>

                        <button
                            type="button"
                            class="btn-acao btn-excluir"
                            data-id="${imovel.id}"
                        >
                            Excluir
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    // ===============================
    // Renderizar imóveis
    // ===============================
    function renderizarImoveis(imoveis) {
        corpoTabela.innerHTML = "";

        if (imoveis.length === 0) {
            mensagemPainel.textContent =
                "Nenhum imóvel cadastrado.";

            mensagemPainel.classList.remove(
                "erro"
            );

            mensagemPainel.style.display =
                "block";

            return;
        }

        mensagemPainel.style.display =
            "none";

        imoveis.forEach((imovel) => {
            corpoTabela.innerHTML +=
                gerarLinhaImovel(imovel);
        });
    }

    // ===============================
    // Carregar imóveis
    // ===============================
    async function carregarImoveis() {
        try {
            const resposta =
                await fetch("/api/imoveis");

            if (!resposta.ok) {
                throw new Error(
                    "Não foi possível carregar os imóveis."
                );
            }

            const imoveis =
                await resposta.json();

            renderizarImoveis(imoveis);

        } catch (erro) {
            console.error(
                "Erro ao carregar imóveis no painel:",
                erro
            );

            mensagemPainel.textContent =
                "Não foi possível carregar os imóveis.";

            mensagemPainel.classList.add(
                "erro"
            );

            mensagemPainel.style.display =
                "block";
        }
    }

    // ===============================
    // Excluir imóvel
    // ===============================
    async function excluirImovel(id) {
        const resposta = await fetch(
            `/api/imoveis/${id}`,
            {
                method: "DELETE"
            }
        );

        if (
            autenticacaoAdmin
                .verificarSessaoExpirada(resposta)
        ) {
            return null;
        }

        const resultado =
            await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                resultado.mensagem ||
                "Não foi possível excluir o imóvel."
            );
        }

        return resultado;
    }

    // ===============================
    // Ações da tabela
    // ===============================
    corpoTabela.addEventListener(
        "click",
        async (event) => {

            // ===============================
            // Editar imóvel
            // ===============================
            const botaoEditar =
                event.target.closest(
                    ".btn-editar"
                );

            if (botaoEditar) {
                const id = Number(
                    botaoEditar.dataset.id
                );

                window.location.href =
                    `editar-imovel.html?id=${id}`;

                return;
            }

            // ===============================
            // Excluir imóvel
            // ===============================
            const botaoExcluir =
                event.target.closest(
                    ".btn-excluir"
                );

            if (!botaoExcluir) {
                return;
            }

            const id = Number(
                botaoExcluir.dataset.id
            );

            const confirmou =
                window.confirm(
                    "Tem certeza de que deseja excluir este imóvel? Esta ação não poderá ser desfeita."
                );

            if (!confirmou) {
                return;
            }

            botaoExcluir.disabled = true;

            botaoExcluir.textContent =
                "Excluindo...";

            try {
                const resultado =
                    await excluirImovel(id);

                if (!resultado) {
                    return;
                }

                window.alert(
                    resultado.mensagem
                );

                await carregarImoveis();

            } catch (erro) {
                console.error(
                    "Erro ao excluir imóvel:",
                    erro
                );

                window.alert(
                    erro.message
                );

                botaoExcluir.disabled = false;

                botaoExcluir.textContent =
                    "Excluir";
            }
        }
    );

    // ===============================
    // Botão sair
    // ===============================
    btnSair.addEventListener(
        "click",
        () => {
            autenticacaoAdmin
                .realizarLogout(btnSair);
        }
    );

    // ===============================
    // Inicialização
    // ===============================
    async function inicializarPainel() {
        const autenticado =
            await autenticacaoAdmin
                .verificarAutenticacao();

        if (!autenticado) {
            return;
        }

        await carregarImoveis();
    }

    inicializarPainel();

})();
