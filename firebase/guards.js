import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';

import { auth, db } from './firebase-config.js';
import { aplicarPermisosMenu, rolValido, tienePermiso } from './roles.js';

function redirigir(url) {
  if (window.location.pathname.endsWith(url)) return;
  window.location.replace(url);
}

function textoSeguro(valor, fallback = '') {
  return typeof valor === 'string' && valor.trim() ? valor.trim() : fallback;
}

function cargarDatosUsuario(datos) {
  const nombreCompleto = `${textoSeguro(datos.nombre, 'Usuario')} ${textoSeguro(datos.apellido, '')}`.trim();
  const rol = textoSeguro(datos.rol, 'docente').toLowerCase();

  const sidebarNombre = document.getElementById('userName');
  const sidebarRol = document.getElementById('userRole');
  const navbarNombre = document.getElementById('navbarUserName');
  const navbarRol = document.getElementById('navbarUserRole');

  if (sidebarNombre) sidebarNombre.textContent = nombreCompleto;
  if (sidebarRol) sidebarRol.textContent = rol;
  if (navbarNombre) navbarNombre.textContent = textoSeguro(datos.nombre, 'Usuario');
  if (navbarRol) navbarRol.textContent = rol;

  aplicarPermisosMenu(rol);
}

/**
 * Protege páginas privadas (dashboard.html)
 */
export function protegerPagina(rolRequerido = null) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      redirigir('login.html');
      return;
    }

    try {
      const usuarioRef = doc(db, 'usuarios', user.uid);
      const usuarioSnap = await getDoc(usuarioRef);

      if (!usuarioSnap.exists()) {
        await signOut(auth);
        redirigir('login.html');
        return;
      }

      const datos = usuarioSnap.data();
      const rol = textoSeguro(datos.rol, 'docente').toLowerCase();

      if (!rolValido(rol)) {
        await signOut(auth);
        redirigir('login.html');
        return;
      }

      if (rolRequerido && !tienePermiso(rol, rolRequerido)) {
        redirigir('dashboard.html');
        return;
      }

      cargarDatosUsuario(datos);
    } catch (error) {
      console.error('Error en guard de autenticación:', error);
      redirigir('login.html');
    }
  });
}

/**
 * Evita que un usuario autenticado vuelva al login
 */
export function protegerLogin() {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      redirigir('dashboard.html');
    }
  });
}

/**
 * Cerrar sesión
 */
export async function cerrarSesion() {
  try {
    await signOut(auth);
    redirigir('login.html');
  } catch (error) {
    console.error(error);
  }
}
