import {
  obtenerEstudiantesServicio,
  crearEstudianteServicio,
  actualizarEstudianteServicio,
  eliminarEstudianteServicio
} from "./estudiantes-service.js";

import { sanitizarTexto } from "../../js/validaciones.js";

let estudiantes = [];
let estudianteEditandoId = null;
let modalEstudiante = null;

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

  return estudiantes.filter((estudiante) => {
    const nombreCompleto = `${estudiante.nombre || ""} ${estudiante.apellido || ""}`.toLowerCase();
    const coincideNombre = nombreCompleto.includes(texto);
    const coincideNivel = !nivel || String(estudiante.nivel || "").toLowerCase().includes(nivel);

    return coincideNombre && coincideNivel;
  });
}

function renderizarTabla() {
  const tabla = document.getElementById("tablaEstudiantes");
  if (!tabla) return;

  const lista = filtrarLista();

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
  } else {
    await crearEstudianteServicio(payload);
    mostrarMensaje("Estudiante creado.");
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

document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("filtroEstudiante")?.addEventListener("input", renderizarTabla);
  document.getElementById("filtroNivel")?.addEventListener("change", renderizarTabla);
  await cargarEstudiantes();
});

window.guardarEstudiante = guardarEstudiante;
window.eliminarEstudiante = eliminarEstudiante;
window.editarEstudiante = editarEstudiante;
