import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import { auth, db } from "./firebase-config.js";
import { aplicarPermisosMenu } from "./roles.js";

/**
 * Protege páginas privadas (dashboard.html)
 */
export function protegerPagina() {

    onAuthStateChanged(auth, async (user) => {

        if (!user) {

            window.location.replace("login.html");
            return;

        }

        try {

            const docRef = doc(db, "usuarios", user.uid);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {

                await signOut(auth);
                window.location.replace("login.html");
                return;

            }

            const datos = docSnap.data();

            

            // Sidebar
            const sidebarNombre = document.getElementById("userName");
            const sidebarRol = document.getElementById("userRole");


            // Navbar
            const navbarNombre = document.getElementById("navbarUserName");
            const navbarRol = document.getElementById("navbarUserRole");

            if (sidebarNombre) sidebarNombre.textContent = datos.nombre + " " + datos.apellido;
            if (sidebarRol) sidebarRol.textContent = datos.rol;

            if (navbarNombre) navbarNombre.textContent = datos.nombre;
            if (navbarRol) navbarRol.textContent = datos.rol;

            
            aplicarPermisosMenu(datos.rol);

        } catch (error) {

            console.error(error);

        }

    });

}

/**
 * Evita que un usuario autenticado vuelva al login
 */
export function protegerLogin() {

    onAuthStateChanged(auth, (user) => {

        if (user) {

            window.location.replace("dashboard.html");

        }

    });

}

/**
 * Cerrar sesión
 */
export async function cerrarSesion() {

    try {

        await signOut(auth);

        window.location.replace("login.html");

    } catch (error) {

        console.error(error);

    }

}