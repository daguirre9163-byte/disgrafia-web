export function inicializarSidebar() {
  const sidebar = document.getElementById('sidebar');
  const btnToggle = document.getElementById('btnToggleSidebar');

  if (!btnToggle) return;

  btnToggle.addEventListener('click', () => {
    sidebar.classList.toggle('active');
  });

  // Cerrar sidebar al hacer clic en un enlace
  const menuLinks = sidebar.querySelectorAll('.menu-link');
  menuLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth < 768) {
        sidebar.classList.remove('active');
      }
    });
  });
}