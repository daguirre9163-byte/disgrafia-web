import { loadModule } from './router.js';
import { inicializarSidebar } from '../components/sidebar/sidebar.js';
import { inicializarNavbar } from '../components/navbar/navbar.js';

let sidebarCargado = false;
let navbarCargado = false;

document.addEventListener('DOMContentLoaded', async function() {
  try {
    // Restaurar tema
    const tema = localStorage.getItem('sigedis.theme') || 'light';
    if (tema === 'dark') {
      document.body.classList.add('dark-mode');
    }

    // Cargar componentes
    if (!sidebarCargado) {
      await cargarSidebar();
      inicializarSidebar();
      sidebarCargado = true;
    }
    
    if (!navbarCargado) {
      await cargarNavbar();
      inicializarNavbar();
      navbarCargado = true;
    }

    // Activar menú
    activarMenu();

    // Cargar dashboard por defecto
    await loadModule('dashboard');

    console.log('✅ SIGEDIS iniciado correctamente');
  } catch (error) {
    console.error('Error al iniciar SIGEDIS:', error);
  }
});

async function cargarSidebar() {
  const response = await fetch('components/sidebar/sidebar.html');
  document.getElementById('sidebar').innerHTML = await response.text();
}

async function cargarNavbar() {
  const response = await fetch('components/navbar/navbar.html');
  document.getElementById('navbar').innerHTML = await response.text();
}

function activarMenu() {
  document.addEventListener('click', async (e) => {
    const opcion = e.target.closest('.menu-link');
    if (!opcion) return;

    e.preventDefault();

    document.querySelectorAll('.menu-link').forEach(item => {
      item.classList.remove('active');
    });

    opcion.classList.add('active');

    const modulo = opcion.dataset.module;
    if (modulo) {
      await loadModule(modulo);
    }
  });
}