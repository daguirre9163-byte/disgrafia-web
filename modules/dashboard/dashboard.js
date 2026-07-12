import { obtenerCursos, obtenerEstudiantes, obtenerEvaluaciones, obtenerActividades } from "../../firebase/firestore.js";

function promedioEvaluaciones(evaluaciones = []) {
  if (!evaluaciones.length) return 0;
  const total = evaluaciones.reduce((acumulado, item) => acumulado + Number(item.calificacion || 0), 0);
  return Number((total / evaluaciones.length).toFixed(2));
}

function actualizarFecha() {
  const hoy = new Date();
  if (document.getElementById("diaActual")) {
    document.getElementById("diaActual").textContent = hoy.getDate();
    document.getElementById("mesActual").textContent = hoy.toLocaleDateString("es-ES", { month: "long" });
    document.getElementById("anioActual").textContent = hoy.getFullYear();
  }
}

function renderActividades(actividades = []) {
  const contenedor = document.getElementById("actividadReciente");
  if (!contenedor) return;

  const lista = actividades.slice(0, 5);

  if (!lista.length) {
    contenedor.innerHTML = '<div class="activity-item"><i class="bi bi-info-circle-fill text-primary"></i>No hay actividades recientes.</div>';
    return;
  }

  contenedor.innerHTML = lista.map((actividad) => `
    <div class="activity-item">
      <i class="bi bi-check-circle-fill text-success"></i>
      ${actividad.nombre || "Actividad sin nombre"}
    </div>
  `).join("");
}

function destruirGrafico(nombre) {
  if (window[nombre]) {
    window[nombre].destroy();
  }
}

function graficarDistribucionDisgrafia(estudiantes = []) {
  const canvas = document.getElementById("chartDisgrafia");
  if (!canvas || typeof Chart === "undefined") return;

  const conteo = estudiantes.reduce((acumulado, estudiante) => {
    const tipo = estudiante.disgrafia || estudiante.tiposDisgrafia?.[0] || "Sin definir";
    acumulado[tipo] = (acumulado[tipo] || 0) + 1;
    return acumulado;
  }, {});

  destruirGrafico("chartDisgrafiaRef");
  window.chartDisgrafiaRef = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: Object.keys(conteo),
      datasets: [{ data: Object.values(conteo) }]
    }
  });
}

function graficarProgresoMes(evaluaciones = []) {
  const canvas = document.getElementById("chartProgresoMes");
  if (!canvas || typeof Chart === "undefined") return;

  const porMes = evaluaciones.reduce((acumulado, evaluacion) => {
    const fecha = evaluacion.fecha?.seconds ? new Date(evaluacion.fecha.seconds * 1000) : new Date();
    const etiqueta = fecha.toLocaleDateString("es-EC", { month: "short", year: "2-digit" });
    acumulado[etiqueta] = acumulado[etiqueta] || { total: 0, cantidad: 0 };
    acumulado[etiqueta].total += Number(evaluacion.calificacion || 0);
    acumulado[etiqueta].cantidad += 1;
    return acumulado;
  }, {});

  const etiquetas = Object.keys(porMes);
  const valores = etiquetas.map((mes) => Number((porMes[mes].total / porMes[mes].cantidad).toFixed(2)));

  destruirGrafico("chartProgresoMesRef");
  window.chartProgresoMesRef = new Chart(canvas, {
    type: "line",
    data: {
      labels: etiquetas,
      datasets: [{
        label: "Promedio mensual",
        data: valores,
        borderColor: "#0d6efd",
        backgroundColor: "rgba(13,110,253,0.2)",
        fill: true,
        tension: 0.3
      }]
    }
  });
}

function graficarComparativa(evaluaciones = []) {
  const canvas = document.getElementById("chartComparativa");
  if (!canvas || typeof Chart === "undefined") return;

  const porTipo = evaluaciones.reduce((acumulado, evaluacion) => {
    const tipo = evaluacion.tipo || "general";
    acumulado[tipo] = acumulado[tipo] || { total: 0, cantidad: 0 };
    acumulado[tipo].total += Number(evaluacion.calificacion || 0);
    acumulado[tipo].cantidad += 1;
    return acumulado;
  }, {});

  const etiquetas = Object.keys(porTipo);
  const valores = etiquetas.map((tipo) => Number((porTipo[tipo].total / porTipo[tipo].cantidad).toFixed(2)));

  destruirGrafico("chartComparativaRef");
  window.chartComparativaRef = new Chart(canvas, {
    type: "bar",
    data: {
      labels: etiquetas,
      datasets: [{
        label: "Promedio por tipo",
        data: valores,
        backgroundColor: "#ffc107"
      }]
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const [estudiantes, cursos, evaluaciones, actividades] = await Promise.all([
      obtenerEstudiantes(),
      obtenerCursos(),
      obtenerEvaluaciones(),
      obtenerActividades()
    ]);

    const totalEst = document.getElementById("totalEstudiantes");
    const totalCurs = document.getElementById("totalCursos");
    const totalEval = document.getElementById("totalEvaluaciones");
    const totalGu = document.getElementById("totalGuias");

    if (totalEst) totalEst.textContent = String(estudiantes.length);
    if (totalCurs) totalCurs.textContent = String(cursos.length);
    if (totalEval) totalEval.textContent = String(promedioEvaluaciones(evaluaciones));
    if (totalGu) totalGu.textContent = String(actividades.length);

    renderActividades(actividades);
    graficarDistribucionDisgrafia(estudiantes);
    graficarProgresoMes(evaluaciones);
    graficarComparativa(evaluaciones);
    actualizarFecha();
  } catch (error) {
    console.error("Error cargando dashboard:", error);
  }
});
