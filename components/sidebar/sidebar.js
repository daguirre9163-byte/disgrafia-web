export function inicializarSidebar() {
    const primerItem = document.querySelector('.menu-link.active') || document.querySelector('.menu-link');
    if (primerItem) {
        primerItem.setAttribute('aria-current', 'page');
    }
}
