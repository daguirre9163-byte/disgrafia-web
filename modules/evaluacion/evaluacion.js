import {
    obtenerEvaluacionesServicio,
    crearEvaluacionServicio,
    calcularPromedioEvaluaciones
} from "./evaluacion-service.js";

import { obtenerEstudiantesServicio } from "../estudiantes/estudiantes-service.js";

let evaluaciones = [];

function renderTabla() {
    const tabla = document.getElementById("tablaEvaluaciones");
    if (!tabla) return;

    if (!evaluaciones.length) {
        tabla.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No hay evaluaciones registradas.</td></tr>';
        return;
    }

    tabla.innerHTML = evaluaciones.map((item) => `
        <tr>
            <td>${item.estudianteNombre || "-"}</td>
            <td>${item.tipo || "General"}</td>
            <td>${item.calificacion || 0}</td>
            <td>${item.observaciones || "-"}</td>
            <td>${item.fecha?.seconds ? new Date(item.fecha.seconds * 1000).toLocaleDateString("es-EC") : "-"}</td>
        </tr>
    `).join("");
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

async function guardarEvaluacion(e) {
    e.preventDefault();

    const estudianteId = document.getElementById("estudianteEvaluacion").value;
    const tipo = document.getElementById("tipoEvaluacion").value;
    const calificacion = Number(document.getElementById("calificacionEvaluacion").value || 0);
    const observaciones = document.getElementById("observacionesEvaluacion").value.trim();
    const estudianteNombre = document.getElementById("estudianteEvaluacion").selectedOptions[0]?.textContent || "";

    if (!estudianteId) {
        alert("Seleccione un estudiante.");
        return;
    }

    await crearEvaluacionServicio({
        estudianteId,
        estudianteNombre,
        tipo,
        calificacion,
        observaciones
    });

    document.getElementById("formEvaluacion")?.reset();
    await cargarEvaluaciones();
}

document.addEventListener("DOMContentLoaded", async () => {
    document.getElementById("formEvaluacion")?.addEventListener("submit", guardarEvaluacion);
    await Promise.all([cargarEstudiantesSelect(), cargarEvaluaciones()]);
});
