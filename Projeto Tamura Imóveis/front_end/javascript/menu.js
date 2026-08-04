// ===============================
// Menu Hambúrguer
// ===============================
const btnMenu = document.getElementById("menu-btn");
const menu = document.querySelector(".navegacao");

if (btnMenu && menu) {

    const linksMenu = menu.querySelectorAll("a");

    linksMenu.forEach((link) => {

        link.addEventListener("click", () => {

            menu.classList.remove("ativo");

        });
    });

    btnMenu.addEventListener("click", () => {

        menu.classList.toggle("ativo");
    });

    document.addEventListener("click", (event) => {

        const clicouNoMenu = menu.contains(event.target);
        const clicouNoBotao = btnMenu.contains(event.target);

        if (!clicouNoMenu && !clicouNoBotao) {

            menu.classList.remove("ativo");

        }
    });
}
