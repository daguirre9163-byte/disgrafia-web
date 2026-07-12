import {
  obtenerEvaluacionesServicio,
  crearEvaluacionServicio,
  calcularPromedioEvaluaciones
} from "./evaluacion-service.js";

import { obtenerEstudiantesServicio } from "../estudiantes/estudiantes-service.js";
import { registrarNotificacion } from "../../js/notificaciones.js";

let evaluaciones = [];
let pasoActual = 1;

function feedback(calificacion) {
  if (calificacion >= 8) return "Excelente progreso";
  if (calificacion >= 5) return "Desempeño estable";
  return "Requiere refuerzo";
}

function cambiarPaso(paso) {
  pasoActual = paso;
  document.querySelectorAll(".form-step").forEach((item) => {
    item.classList.toggle("active", Number(item.dataset.step) === pasoActual);
  });

  document.querySelectorAll(".wizard-step").forEach((item) => {
    item.classList.toggle("active", Number(item.dataset.step) === pasoActual);
  });
}

function renderTabla() {
  const tabla = document.getElementById("tablaEvaluaciones");
  if (!tabla) return;

  if (!evaluaciones.length) {
    tabla.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No hay evaluaciones registradas.</td></tr>';
    return;
  }

  tabla.innerHTML = evaluaciones.map((item) => {
    const nota = Number(item.calificacion || 0);
    return `
      <tr>
        <td>${item.estudianteNombre || "-"}</td>
        <td>${item.tipo || "General"}</td>
        <td>${nota}</td>
        <td><span class="badge ${nota < 5 ? "bg-danger" : "bg-success"}">${feedback(nota)}</span></td>
        <td>${item.observaciones || "-"}</td>
        <td>${item.fecha?.seconds ? new Date(item.fecha.seconds * 1000).toLocaleDateString("es-EC") : "-"}</td>
      </tr>
    `;
  }).join("");
}

async function cargarEvaluaciones() {
  evaluaciones = await obtenerEvaluacionesServicio();
  renderTabla();

  const promedio = document.getElementById("promedioEvaluaciones");
  if (promedio) {
    promedio.textContent = String(calcularPromedioEvaluaciones(evaluaciones));
  }
}

async function cargarEstudiantesSelect() {
  const select = document.getElementById("estudianteEvaluacion");
  if (!select) return;

  const estudiantes = await obtenerEstudiantesServicio();
  select.innerHTML = '<option value="">Seleccione estudiante</option>' + estudiantes
    .map((estudiante) => `<option value="${estudiante.id}">${estudiante.nombre || ""} ${estudiante.apellido || ""}</option>`)
    .join("");
}

function validarPaso1() {
  const estudianteId = document.getElementById("estudianteEvaluacion").value;
  const error = document.getElementById("errorEstudiante");
  if (!estudianteId) {
    error.textContent = "Seleccione un estudiante.";
    return false;
  }
  error.textContent = "";
  return true;
}

function validarPaso2() {
  const calificacion = Number(document.getElementById("calificacionEvaluacion").value || 0);
  const error = document.getElementById("errorCalificacion");
  if (Number.isNaN(calificacion) || calificacion < 0 || calificacion > 10) {
    error.textContent = "Ingrese una calificación entre 0 y 10.";
    return false;
  }
  error.textContent = "";
  return true;
}

function completarResumen() {
  const estudianteNombre = document.getElementById("estudianteEvaluacion").selectedOptions[0]?.textContent || "";
  const tipo = document.getElementById("tipoEvaluacion").value;
  const calificacion = Number(document.getElementById("calificacionEvaluacion").value || 0);
  const observaciones = document.getElementById("observacionesEvaluacion").value.trim();

  document.getElementById("resumenEvaluacion").innerHTML = `
    <strong>Estudiante:</strong> ${estudianteNombre}<br>
    <strong>Tipo:</strong> ${tipo}<br>
    <strong>Calificación:</strong> ${calificacion}<br>
    <strong>Feedback:</strong> ${feedback(calificacion)}<br>
    <strong>Observaciones:</strong> ${observaciones || "-"}
  `;
}

async function guardarEvaluacion(e) {
  e.preventDefault();
  const btn = document.getElementById("btnGuardarEvaluacion");
  btn.classList.add("btn-loading");
  btn.disabled = true;

  const estudianteId = document.getElementById("estudianteEvaluacion").value;
  const tipo = document.getElementById("tipoEvaluacion").value;
  const calificacion = Number(document.getElementById("calificacionEvaluacion").value || 0);
  const observaciones = document.getElementById("observacionesEvaluacion").value.trim();
  const estudianteNombre = document.getElementById("estudianteEvaluacion").selectedOptions[0]?.textContent || "";

  await crearEvaluacionServicio({ estudianteId, estudianteNombre, tipo, calificacion, observaciones });

  if (calificacion < 5) {
    await registrarNotificacion({ mensaje: `Estudiante ${estudianteNombre} tiene promedio < 5`, tipo: "warning" });
  } else {
    await registrarNotificacion({ mensaje: "Evaluación registrada exitosamente", tipo: "success" });
  }

  document.getElementById("formEvaluacion")?.reset();
  cambiarPaso(1);
  await cargarEvaluaciones();
  btn.classList.remove("btn-loading");
  btn.disabled = false;
}

async function initEvaluacion() {
  document.getElementById("formEvaluacion")?.addEventListener("submit", guardarEvaluacion);

  document.getElementById("btnPasoSiguiente")?.addEventListener("click", () => {
    if (validarPaso1()) cambiarPaso(2);
  });

  document.getElementById("btnPasoAnterior")?.addEventListener("click", () => cambiarPaso(1));

  document.getElementById("btnPasoConfirmar")?.addEventListener("click", () => {
    if (validarPaso2()) {
      completarResumen();
      cambiarPaso(3);
    }
  });

  document.getElementById("btnVolverEditar")?.addEventListener("click", () => cambiarPaso(2));

  await Promise.all([cargarEstudiantesSelect(), cargarEvaluaciones()]);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initEvaluacion);
} else {
  initEvaluacion();
}
