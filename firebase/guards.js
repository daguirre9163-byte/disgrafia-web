import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import { auth } from "./firebase-config.js";
import { obtenerUsuario } from "./firestore.js";
import { aplicarPermisosMenu, validarPermiso as validarPermisoRol } from "./roles.js";

function redirigir(ruta) {
    window.location.replace(ruta);
}

async function obtenerPerfil(user) {
    if (!user) {
        return null;
    }

    return obtenerUsuario(user.uid);
}

export function validarPermiso(usuario, accion, recurso) {
    return validarPermisoRol(usuario, accion, recurso);
}

export function protegerRuta(permisoRequerido) {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            redirigir("login.html");
            return;
        }

        try {
            const perfil = await obtenerPerfil(user);

            if (!perfil || perfil.estado === "inactivo") {
                await signOut(auth);
                redirigir("login.html");
                return;
            }

            if (permisoRequerido) {
                const [recurso, accion] = permisoRequerido.split(":");
                if (!validarPermiso(perfil, accion, recurso)) {
                    redirigir("403.html");
                    return;
                }
            }

            const sidebarNombre = document.getElementById("userName");
            const sidebarRol = document.getElementById("userRole");
            const navbarNombre = document.getElementById("navbarUserName");
            const navbarRol = document.getElementById("navbarUserRole");

            if (sidebarNombre) sidebarNombre.textContent = `${perfil.nombre} ${perfil.apellido}`.trim();
            if (sidebarRol) sidebarRol.textContent = perfil.rol;
            if (navbarNombre) navbarNombre.textContent = perfil.nombre || "Usuario";
            if (navbarRol) navbarRol.textContent = perfil.rol;

            aplicarPermisosMenu(perfil.rol);
        } catch (error) {
            console.error(error);
            redirigir("login.html");
        }
    });
}

export function protegerPagina() {
    protegerRuta();
}

export function protegerLogin() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            redirigir("dashboard.html");
        }
    });
}

export async function cerrarSesion() {
    try {
        await signOut(auth);
        redirigir("login.html");
    } catch (error) {
        console.error(error);
    }
}
