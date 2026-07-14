import { loadModule } from "./router.js";
import { inicializarSidebar } from "../components/sidebar/sidebar.js";
import { inicializarNavbar } from "../components/navbar/navbar.js";
import { migrarLocalStorageAFirestore } from "./firestore-service.js";
import { crearEstudiante, crearEvaluacion, crearActividad } from "../firebase/firestore.js";
import { inicializarNotificaciones, registrarNotificacion } from "./notificaciones.js";
import { inicializarAnalytics, registrarEvento } from "./analytics.js";
import { auth } from "../firebase/firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

let sidebarCargado = false;
let navbarCargado = false;

document.addEventListener("DOMContentLoaded", async () => {
  try {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/public/service-worker.js").catch((error) => {
        console.warn("No se pudo registrar el Service Worker:", error);
      });
    }

    const tema = localStorage.getItem("sigedis.theme") || "light";
    if (tema === "dark") {
      document.body.classList.add("dark-mode");
    }

    if (!sidebarCargado) {
      await cargarSidebar();
      inicializarSidebar();
      sidebarCargado = true;
    }

    if (!navbarCargado) {
      await cargarNavbar();
      inicializarNavbar();
      await inicializarNotificaciones();
      navbarCargado = true;
    }

    inicializarAnalytics();
    await migrarDatosLocales();
    activarMenu();
    await loadModule("dashboard");
    await registrarEvento("sesion_iniciada", { modulo: "dashboard" });
    iniciarControlSesion();

    console.log("✅ SIGEDIS iniciado correctamente");
  } catch (error) {
    console.error("Error al iniciar SIGEDIS:", error);
  }
});

async function cargarSidebar() {
  const response = await fetch("components/sidebar/sidebar.html");
  document.getElementById("sidebar").innerHTML = await response.text();
}

async function cargarNavbar() {
  const response = await fetch("components/navbar/navbar.html");
  document.getElementById("navbar").innerHTML = await response.text();
}

async function migrarDatosLocales() {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) {
    return;
  }

  if (!localStorage.getItem("migracion.firestore.v1")) {
    await migrarLocalStorageAFirestore({
      localStorageKey: "estudiantes",
      crearRegistro: crearEstudiante,
      transformador: (item) => ({
        nombre: item.nombre,
        nivel: item.nivel,
        disgrafia: item.disgrafia,
        tiposDisgrafia: item.disgrafia ? [item.disgrafia] : []
      })
    });

    await migrarLocalStorageAFirestore({
      localStorageKey: "evaluaciones",
      crearRegistro: crearEvaluacion
    });

    await migrarLocalStorageAFirestore({
      localStorageKey: "curriculum",
      crearRegistro: crearActividad,
      transformador: (item) => ({
        nombre: item.nombre,
        descripcion: item.descripcion,
        nivel: item.nivel,
        tiposDisgrafia: item.tiposDisgrafia || []
      })
    });

    localStorage.setItem("migracion.firestore.v1", "ok");
  }

  function obtenerUsuarioActual() {
    if (auth.currentUser) {
      return Promise.resolve(auth.currentUser);
    }

    return new Promise((resolve) => {
      const unsub = onAuthStateChanged(auth, (user) => {
        unsub();
        resolve(user || null);
      });
    });
  }
}

function activarMenu() {
  document.addEventListener("click", async (e) => {
    const opcion = e.target.closest("[data-module]");
    if (!opcion || !opcion.dataset.module) return;

    e.preventDefault();

    if (opcion.classList.contains("menu-link")) {
      document.querySelectorAll(".menu-link").forEach((item) => {
        item.classList.remove("active");
      });

      opcion.classList.add("active");
    }

    await loadModule(opcion.dataset.module);
    await registrarEvento("navegacion_modulo", { modulo: opcion.dataset.module });
  });
}

function iniciarControlSesion() {
  const TIEMPO_LIMITE = 30 * 60 * 1000;
  const ALERTA_ANTES = 2 * 60 * 1000;
  let ultimoEvento = Date.now();
  let avisoMostrado = false;

  const registrarActividad = () => {
    ultimoEvento = Date.now();
    avisoMostrado = false;
  };

  ["click", "keydown", "mousemove", "scroll"].forEach((evento) => {
    window.addEventListener(evento, registrarActividad, { passive: true });
  });

  setInterval(async () => {
    const inactividad = Date.now() - ultimoEvento;
    if (!avisoMostrado && inactividad >= (TIEMPO_LIMITE - ALERTA_ANTES)) {
      avisoMostrado = true;
      await registrarNotificacion({
        mensaje: "Tu sesión se cerrará pronto por inactividad.",
        tipo: "warning"
      });
    }
  }, 30000);
}
