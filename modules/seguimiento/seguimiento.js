import { obtenerEstudiantesServicio } from "../estudiantes/estudiantes-service.js";
import { obtenerEvaluacionesServicio } from "../evaluacion/evaluacion-service.js";

let estudiantes = [];

function dibujarGrafico(evaluaciones) {
  const canvas = document.getElementById("graficoProgreso");
  if (!canvas || typeof Chart === "undefined") {
    return;
  }

  const contexto = canvas.getContext("2d");
  if (window.graficoSeguimiento) {
    window.graficoSeguimiento.destroy();
  }

  window.graficoSeguimiento = new Chart(contexto, {
    type: "line",
    data: {
      labels: evaluaciones.map((_, index) => `Eval ${index + 1}`),
      datasets: [{
        label: "Calificación",
        data: evaluaciones.map((item) => Number(item.calificacion || 0)),
        borderColor: "#198754",
        backgroundColor: "rgba(25,135,84,.2)",
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { min: 0, max: 10 }
      }
    }
  });
}

async function cargarSeguimiento() {
  const id = document.getElementById("selectEstudiante")?.value;
  if (!id) {
    document.getElementById("infoEstudiante").innerHTML = "";
    document.getElementById("evaluacionesList").innerHTML = '<p class="text-muted">Selecciona un estudiante</p>';
    dibujarGrafico([]);
    return;
  }

  const estudiante = estudiantes.find((item) => item.id === id);
  const evaluaciones = await obtenerEvaluacionesServicio({ estudianteId: id });

  if (estudiante) {
    document.getElementById("infoEstudiante").innerHTML = `
      <div class="card mb-4 border-0 shadow-sm bg-light">
        <div class="card-body">
          <h5>${estudiante.nombre || ""} ${estudiante.apellido || ""}</h5>
          <p class="mb-1"><strong>Nivel:</strong> ${estudiante.nivel || "-"}</p>
          <p class="mb-0"><strong>Tipo de Disgrafía:</strong> <span class="badge bg-info">${estudiante.disgrafia || "-"}</span></p>
        </div>
      </div>
    `;
  }

  if (!evaluaciones.length) {
    document.getElementById("evaluacionesList").innerHTML = '<p class="text-muted">No hay evaluaciones para este estudiante.</p>';
  } else {
    document.getElementById("evaluacionesList").innerHTML = evaluaciones.map((evaluacion) => `
      <div class="border-bottom py-2">
        <strong>${evaluacion.tipo || "General"}</strong>
        <div>Calificación: ${Number(evaluacion.calificacion || 0).toFixed(2)}</div>
      </div>
    `).join("");
  }

  dibujarGrafico(evaluaciones);
}

function exportarSeguimientoPDF() {
  const estudiante = document.getElementById("selectEstudiante")?.selectedOptions?.[0]?.textContent;
  const evaluacionesTexto = document.getElementById("evaluacionesList")?.innerText || "";

  if (!estudiante || estudiante.includes("Elige")) {
    alert("Seleccione un estudiante para exportar.");
    return;
  }

  if (window.jspdf?.jsPDF) {
    const doc = new window.jspdf.jsPDF();
    doc.setFontSize(14);
    doc.text("Reporte de progreso", 14, 20);
    doc.setFontSize(11);
    doc.text(`Estudiante: ${estudiante}`, 14, 30);
    doc.text(evaluacionesTexto || "Sin evaluaciones registradas.", 14, 40, { maxWidth: 180 });
    doc.save(`seguimiento-${estudiante.replace(/\s+/g, "-").toLowerCase()}.pdf`);
    return;
  }

  window.print();
}

document.addEventListener("DOMContentLoaded", async () => {
  estudiantes = await obtenerEstudiantesServicio();
  const select = document.getElementById("selectEstudiante");

  if (select) {
    select.innerHTML = '<option value="">-- Elige un estudiante --</option>' +
      estudiantes.map((estudiante) => `<option value="${estudiante.id}">${estudiante.nombre || ""} ${estudiante.apellido || ""}</option>`).join("");

    select.addEventListener("change", cargarSeguimiento);
  }

  document.getElementById("btnExportarSeguimiento")?.addEventListener("click", exportarSeguimientoPDF);
});

window.cargarSeguimiento = cargarSeguimiento;
