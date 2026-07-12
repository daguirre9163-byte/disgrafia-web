import {
  obtenerEstudiantesServicio,
  crearEstudianteServicio,
  actualizarEstudianteServicio,
  eliminarEstudianteServicio
} from "./estudiantes-service.js";

import { sanitizarTexto } from "../../js/validaciones.js";
import { registrarNotificacion } from "../../js/notificaciones.js";

let estudiantes = [];
let estudianteEditandoId = null;
let modalEstudiante = null;
let vistaTarjeta = false;

function getModal() {
  if (!modalEstudiante) {
    modalEstudiante = new bootstrap.Modal(document.getElementById("modalEstudiante"));
  }

  return modalEstudiante;
}

function mostrarMensaje(mensaje, tipo = "success") {
  const tabla = document.getElementById("tablaEstudiantes");
  if (!tabla) return;

  const alerta = document.createElement("tr");
  alerta.innerHTML = `<td colspan="5" class="text-center text-${tipo === "danger" ? "danger" : "success"}">${sanitizarTexto(mensaje)}</td>`;
  tabla.prepend(alerta);

  setTimeout(() => alerta.remove(), 2500);
}

function filtrarLista() {
  const texto = document.getElementById("filtroEstudiante")?.value?.toLowerCase() || "";
  const nivel = document.getElementById("filtroNivel")?.value?.toLowerCase() || "";
  const disgrafia = document.getElementById("filtroDisgrafia")?.value?.toLowerCase() || "";

  return estudiantes.filter((estudiante) => {
    const nombreCompleto = `${estudiante.nombre || ""} ${estudiante.apellido || ""}`.toLowerCase();
    const coincideNombre = nombreCompleto.includes(texto);
    const coincideNivel = !nivel || String(estudiante.nivel || "").toLowerCase().includes(nivel);
    const coincideDisgrafia = !disgrafia || String(estudiante.disgrafia || "").toLowerCase().includes(disgrafia);

    return coincideNombre && coincideNivel && coincideDisgrafia;
  });
}

function renderizarTabla() {
  const tabla = document.getElementById("tablaEstudiantes");
  if (!tabla) return;

  const lista = filtrarLista();
  const cards = document.getElementById("cardsEstudiantes");
  if (cards) {
    cards.innerHTML = lista.map((estudiante) => `
      <div class="col-md-4">
        <div class="card border-0 shadow-sm">
          <div class="card-body">
            <h6>${sanitizarTexto(`${estudiante.nombre || ""} ${estudiante.apellido || ""}`.trim())}</h6>
            <p class="mb-1"><strong>Nivel:</strong> ${sanitizarTexto(estudiante.nivel || "-")}</p>
            <p class="mb-0"><strong>Disgrafía:</strong> ${sanitizarTexto(estudiante.disgrafia || "-")}</p>
          </div>
        </div>
      </div>
    `).join("");
  }

  if (!lista.length) {
    tabla.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No hay estudiantes registrados</td></tr>';
    return;
  }

  tabla.innerHTML = lista.map((estudiante) => {
    return `
      <tr>
        <td><strong>${sanitizarTexto(`${estudiante.nombre || ""} ${estudiante.apellido || ""}`.trim())}</strong></td>
        <td>${sanitizarTexto(estudiante.nivel || "-")}</td>
        <td><span class="badge bg-info">${sanitizarTexto(estudiante.disgrafia || "-")}</span></td>
        <td>${sanitizarTexto(String(estudiante.totalEvaluaciones || 0))}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary" onclick="editarEstudiante('${estudiante.id}')">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="eliminarEstudiante('${estudiante.id}')">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

async function cargarEstudiantes() {
  estudiantes = await obtenerEstudiantesServicio();
  renderizarTabla();
}

function limpiarFormulario() {
  const form = document.getElementById("formEstudiante");
  if (form) {
    form.reset();
  }

  estudianteEditandoId = null;
}

async function guardarEstudiante() {
  const nombre = sanitizarTexto(document.getElementById("nombreEst")?.value);
  const nivel = sanitizarTexto(document.getElementById("nivelEst")?.value);
  const disgrafia = sanitizarTexto(document.getElementById("disgrafia")?.value);

  if (!nombre || !nivel || !disgrafia) {
    mostrarMensaje("Complete los campos obligatorios.", "danger");
    return;
  }

  const payload = {
    nombre,
    nivel,
    disgrafia,
    tiposDisgrafia: [disgrafia]
  };

  if (estudianteEditandoId) {
    await actualizarEstudianteServicio(estudianteEditandoId, payload);
    mostrarMensaje("Estudiante actualizado.");
    await registrarNotificacion({ mensaje: "Estudiante actualizado", tipo: "info" });
  } else {
    await crearEstudianteServicio(payload);
    mostrarMensaje("Estudiante creado.");
    await registrarNotificacion({ mensaje: "Estudiante agregado correctamente", tipo: "success" });
  }

  limpiarFormulario();
  getModal().hide();
  await cargarEstudiantes();
}

async function eliminarEstudiante(id) {
  if (!confirm("¿Eliminar estudiante?")) {
    return;
  }

  await eliminarEstudianteServicio(id);
  mostrarMensaje("Estudiante eliminado.");
  await registrarNotificacion({ mensaje: "Estudiante eliminado", tipo: "warning" });
  await cargarEstudiantes();
}

async function editarEstudiante(id) {
  const estudiante = estudiantes.find((item) => item.id === id);
  if (!estudiante) return;

  estudianteEditandoId = id;
  document.getElementById("nombreEst").value = estudiante.nombre || "";
  document.getElementById("nivelEst").value = estudiante.nivel || "Educación Inicial";
  document.getElementById("disgrafia").value = estudiante.disgrafia || "Motriz";
  getModal().show();
}

async function initEstudiantes() {
  document.getElementById("filtroEstudiante")?.addEventListener("input", renderizarTabla);
  document.getElementById("filtroNivel")?.addEventListener("change", renderizarTabla);
  document.getElementById("filtroDisgrafia")?.addEventListener("change", renderizarTabla);
  document.getElementById("btnVistaEstudiantes")?.addEventListener("click", () => {
    vistaTarjeta = !vistaTarjeta;
    document.querySelector(".table-responsive")?.classList.toggle("d-none", vistaTarjeta);
    document.getElementById("cardsEstudiantes")?.classList.toggle("d-none", !vistaTarjeta);
    document.getElementById("btnVistaEstudiantes").innerHTML = vistaTarjeta
      ? '<i class="bi bi-table"></i> Vista tabla'
      : '<i class="bi bi-grid"></i> Vista tarjeta';
  });

  document.getElementById("btnImportarCSV")?.addEventListener("click", async () => {
    const archivo = document.getElementById("csvEstudiantes")?.files?.[0];
    if (!archivo || !window.Papa) return;

    window.Papa.parse(archivo, {
      header: true,
      complete: async ({ data }) => {
        for (const item of data) {
          if (!item.nombre) continue;
          await crearEstudianteServicio({
            nombre: sanitizarTexto(item.nombre),
            nivel: sanitizarTexto(item.nivel || "Educación Inicial"),
            disgrafia: sanitizarTexto(item.disgrafia || "Motriz"),
            tiposDisgrafia: [sanitizarTexto(item.disgrafia || "Motriz")]
          });
        }

        await registrarNotificacion({ mensaje: "Importación masiva completada", tipo: "success" });
        await cargarEstudiantes();
      }
    });
  });
  await cargarEstudiantes();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initEstudiantes);
} else {
  initEstudiantes();
}

window.guardarEstudiante = guardarEstudiante;
window.eliminarEstudiante = eliminarEstudiante;
window.editarEstudiante = editarEstudiante;
