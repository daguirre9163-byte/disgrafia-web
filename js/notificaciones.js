import {
  crearNotificacion,
  obtenerNotificaciones,
  marcarNotificacionLeida,
  limpiarNotificacionesAntiguas
} from "../firebase/firestore.js";
import { sanitizarTexto } from "./validaciones.js";

const MAX_DROPDOWN = 10;
const LOCAL_KEY = "sigedis.notificaciones";
let notificaciones = [];

function getElementos() {
  return {
    contador: document.getElementById("notificacionesContador"),
    lista: document.getElementById("notificacionesLista"),
    vacio: document.getElementById("notificacionesVacio")
  };
}

function claseToast(tipo) {
  return {
    success: "text-bg-success",
    warning: "text-bg-warning",
    error: "text-bg-danger",
    info: "text-bg-primary"
  }[tipo] || "text-bg-primary";
}

function icono(tipo) {
  return {
    success: "bi-check-circle-fill",
    warning: "bi-exclamation-triangle-fill",
    error: "bi-x-circle-fill",
    info: "bi-info-circle-fill"
  }[tipo] || "bi-info-circle-fill";
}

export function mostrarToast(mensaje, tipo = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast align-items-center border-0 ${claseToast(tipo)}`;
  toast.role = "alert";
  toast.ariaLive = "assertive";
  toast.ariaAtomic = "true";

  const mensajeSeguro = sanitizarTexto(mensaje);
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">
        <i class="bi ${icono(tipo)} me-2" aria-hidden="true"></i>${mensajeSeguro}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Cerrar"></button>
    </div>
  `;

  container.appendChild(toast);
  const instance = new bootstrap.Toast(toast, { delay: 5000 });
  instance.show();
  toast.addEventListener("hidden.bs.toast", () => toast.remove());
}

function guardarLocal(items) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
}

function cargarLocal() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
  } catch {
    return [];
  }
}

function fechaLegible(fechaCreacion) {
  const ms = fechaCreacion?.seconds ? fechaCreacion.seconds * 1000 : Date.now();
  return new Date(ms).toLocaleString("es-EC");
}

function renderCentro() {
  const { contador, lista, vacio } = getElementos();
  if (!contador || !lista) return;

  const pendientes = notificaciones.filter((item) => !item.leida).length;
  contador.textContent = String(pendientes);
  contador.classList.toggle("d-none", pendientes === 0);

  const ultimas = notificaciones.slice(0, MAX_DROPDOWN);
  lista.innerHTML = "";
  ultimas.forEach((item) => {
    const li = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = `dropdown-item notification-item ${item.leida ? "" : "fw-semibold"}`.trim();
    button.dataset.id = String(item.id || "");

    const fecha = document.createElement("div");
    fecha.className = "small text-muted";
    fecha.textContent = fechaLegible(item.fechaCreacion);

    const mensaje = document.createElement("div");
    mensaje.textContent = sanitizarTexto(item.mensaje || "");

    button.appendChild(fecha);
    button.appendChild(mensaje);
    li.appendChild(button);
    lista.appendChild(li);
  });

  if (!ultimas.length && vacio) {
    vacio.classList.remove("d-none");
  } else if (vacio) {
    vacio.classList.add("d-none");
  }

  lista.querySelectorAll(".notification-item").forEach((boton) => {
    boton.addEventListener("click", async () => {
      const id = boton.dataset.id;
      if (!id) return;
      await marcarComoLeida(id);
    });
  });
}

export async function recargarNotificaciones() {
  try {
    notificaciones = await obtenerNotificaciones();
    guardarLocal(notificaciones);
  } catch (error) {
    console.warn("No se pudieron cargar notificaciones en Firestore:", error);
    notificaciones = cargarLocal();
  }

  renderCentro();
}

export async function registrarNotificacion({ mensaje, tipo = "info" }) {
  try {
    await crearNotificacion({ mensaje, tipo, leida: false });
  } catch (error) {
    const local = cargarLocal();
    local.unshift({
      id: `local-${Date.now()}`,
      mensaje,
      tipo,
      leida: false,
      fechaCreacion: { seconds: Math.floor(Date.now() / 1000) }
    });
    guardarLocal(local);
  }

  mostrarToast(mensaje, tipo);
  await recargarNotificaciones();
}

export async function marcarComoLeida(id) {
  try {
    await marcarNotificacionLeida(id);
  } catch {
    const local = cargarLocal().map((item) => item.id === id ? { ...item, leida: true } : item);
    guardarLocal(local);
  }

  notificaciones = notificaciones.map((item) => item.id === id ? { ...item, leida: true } : item);
  renderCentro();
}

export async function limpiarNotificaciones() {
  try {
    await limpiarNotificacionesAntiguas();
  } catch {
    const limite = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const local = cargarLocal().filter((item) => {
      const fecha = (item?.fechaCreacion?.seconds || 0) * 1000;
      return !fecha || fecha >= limite;
    });
    guardarLocal(local);
  }

  await recargarNotificaciones();
}

export async function inicializarNotificaciones() {
  const btnLimpiar = document.getElementById("btnLimpiarNotificaciones");
  if (btnLimpiar) {
    btnLimpiar.addEventListener("click", async (e) => {
      e.preventDefault();
      await limpiarNotificaciones();
      mostrarToast("Notificaciones antiguas limpiadas", "info");
    });
  }

  await recargarNotificaciones();
}
