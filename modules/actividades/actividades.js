import { obtenerActividadesServicio, crearActividadServicio } from "./actividades-service.js";
import { registrarNotificacion } from "../../js/notificaciones.js";

let actividades = [];

function render() {
  const body = document.getElementById("tablaActividadesBody");
  if (!body) return;

  if (!actividades.length) {
    body.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No hay actividades registradas.</td></tr>';
  } else {
    body.innerHTML = actividades.map((item) => `
      <tr>
        <td>${item.nombre || "-"}</td>
        <td>${item.nivel || "-"}</td>
        <td>${item.asignado || "-"}</td>
        <td>
          <div class="progress" role="progressbar" aria-label="Progreso de actividad">
            <div class="progress-bar" style="width:${Number(item.progreso || 0)}%">${Number(item.progreso || 0)}%</div>
          </div>
        </td>
        <td><button class="btn btn-sm btn-outline-success btnCompletar" data-id="${item.id}">Completar</button></td>
      </tr>
    `).join("");
  }

  document.getElementById("kpiActividadesTotal").textContent = String(actividades.length);
  document.getElementById("kpiActividadesCompletadas").textContent = String(actividades.filter((item) => Number(item.progreso || 0) >= 100).length);

  body.querySelectorAll(".btnCompletar").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      actividades = actividades.map((item) => item.id === id ? { ...item, progreso: 100 } : item);
      render();
      await registrarNotificacion({ mensaje: "Actividad completada por estudiante", tipo: "success" });
    });
  });
}

async function cargar() {
  actividades = await obtenerActividadesServicio();
  render();
}

async function initActividades() {
  await cargar();

  const modalElement = document.getElementById("modalActividad");
  const modal = modalElement ? new bootstrap.Modal(modalElement) : null;

  document.getElementById("btnGuardarActividad")?.addEventListener("click", async () => {
    const nombre = document.getElementById("actividadNombre")?.value.trim();
    const nivel = document.getElementById("actividadNivel")?.value.trim();
    const asignado = document.getElementById("actividadAsignado")?.value.trim();

    if (!nombre || !nivel) return;

    await crearActividadServicio({ nombre, nivel, asignado, progreso: 0 });
    await registrarNotificacion({ mensaje: "Actividad creada exitosamente", tipo: "success" });
    document.getElementById("formActividad")?.reset();
    modal?.hide();
    await cargar();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initActividades);
} else {
  initActividades();
}
