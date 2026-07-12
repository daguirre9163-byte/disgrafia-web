import { registrarEventoAnalytics } from "../firebase/firestore.js";

const STORAGE_KEY = "sigedis.analytics";
let pageStart = Date.now();

function guardarLocal(evento) {
  const lista = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  lista.unshift(evento);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lista.slice(0, 200)));
}

export async function registrarEvento(tipo, metadata = {}) {
  const evento = {
    tipo,
    metadata,
    timestamp: new Date().toISOString()
  };

  guardarLocal(evento);

  try {
    await registrarEventoAnalytics(evento);
  } catch (error) {
    console.warn("Analytics en modo local:", error);
  }
}

export function obtenerEventosLocales() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

export function inicializarAnalytics() {
  pageStart = Date.now();

  document.addEventListener("click", (e) => {
    const target = e.target.closest("button, a, .menu-link, [data-track]");
    if (!target) return;

    registrarEvento("click", {
      texto: (target.textContent || "").trim().slice(0, 80),
      modulo: target.dataset.module || "",
      id: target.id || ""
    });
  });

  window.addEventListener("beforeunload", () => {
    const segundos = Math.max(1, Math.round((Date.now() - pageStart) / 1000));
    registrarEvento("tiempo_pagina", {
      ruta: window.location.pathname,
      segundos
    });
  });
}
