export function inicializarNavbar() {
  const btnDarkMode = document.getElementById('btnDarkMode');
  const searchInput = document.getElementById('searchInput');

  // Tema oscuro
  if (btnDarkMode) {
    btnDarkMode.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      const tema = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
      localStorage.setItem('sigedis.theme', tema);
    });
  }

  // Búsqueda
  if (searchInput) {
    searchInput.addEventListener('keyup', (e) => {
      console.log('Buscando:', e.target.value);
    });
  }
}