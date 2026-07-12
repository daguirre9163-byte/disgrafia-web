export function inicializarNavbar() {
    const buscador = document.querySelector('.search-box input');
    if (!buscador) return;

    buscador.addEventListener('input', (event) => {
        const termino = event.target.value.trim().toLowerCase();
        document.querySelectorAll('.menu-link').forEach((link) => {
            const texto = link.textContent.toLowerCase();
            const visible = !termino || texto.includes(termino);
            link.parentElement.style.display = visible ? '' : 'none';
        });
    });
}
