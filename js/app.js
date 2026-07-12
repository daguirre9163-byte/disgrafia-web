//======================================================
// SIGEDIS
// APP PRINCIPAL
//======================================================

import { loadModule } from "./router.js";
import { cerrarSesion } from "../firebase/guards.js";

//======================================================

document.addEventListener("DOMContentLoaded", iniciarAplicacion);

//======================================================

async function iniciarAplicacion() {

    try {

        await cargarSidebar();

        await cargarNavbar();

        activarMenu();

        await loadModule("dashboard");

        console.log("✅ SIGEDIS iniciado correctamente");

    } catch (error) {

        console.error("Error al iniciar SIGEDIS:", error);

    }

}

//======================================================
// CARGAR SIDEBAR
//======================================================

async function cargarSidebar() {

    const response = await fetch("components/sidebar/sidebar.html");

    document.getElementById("sidebar").innerHTML = await response.text();

}

//======================================================
// CARGAR NAVBAR
//======================================================

async function cargarNavbar() {

    const response = await fetch("components/navbar/navbar.html");

    document.getElementById("navbar").innerHTML = await response.text();

}

//======================================================
// MENÚ
//======================================================

function activarMenu() {

    document.addEventListener("click", async (e) => {

        const opcion = e.target.closest(".menu-link");

        if (!opcion) return;

        e.preventDefault();

        document.querySelectorAll(".menu-link").forEach(item => {

            item.classList.remove("active");

        });

        opcion.classList.add("active");

        await loadModule(opcion.dataset.module);

    });

}

//======================================================
// BOTÓN SIDEBAR
//======================================================

document.addEventListener("click", (e) => {

    if (e.target.closest("#btnToggleSidebar")) {

        document.getElementById("sidebar").classList.toggle("active");

    }

});

//======================================================
// MODO OSCURO
//======================================================

document.addEventListener("click", (e) => {

    if (e.target.closest("#btnDarkMode")) {

        document.body.classList.toggle("dark-mode");

    }

});

//======================================================
// CERRAR SESIÓN
//======================================================

document.addEventListener("click", (e) => {

    if (e.target.closest("#btnCerrarSesion")) {

        cerrarSesion();

    }

});