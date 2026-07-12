import { obtenerCursos, obtenerEstudiantes, obtenerEvaluaciones, obtenerActividades, obtenerRecursos } from "../../firebase/firestore.js";

function promedio(lista = []) {
  if (!lista.length) return 0;
  const total = lista.reduce((acc, item) => acc + Number(item.calificacion || 0), 0);
  return Number((total / lista.length).toFixed(2));
}

function destruirGrafico(nombre) {
  if (window[nombre]) {
    window[nombre].destroy();
  }
}

function porMes(evaluaciones = []) {
  const mapa = {};
  evaluaciones.forEach((item) => {
    const segundos = item?.fecha?.seconds || item?.fechaCreacion?.seconds;
    if (!segundos) return;
    const fecha = new Date(segundos * 1000);
    const llave = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
    mapa[llave] = mapa[llave] || [];
    mapa[llave].push(Number(item.calificacion || 0));
  });

  const labels = Object.keys(mapa).sort();
  return { labels, data: labels.map((mes) => promedio(mapa[mes].map((calificacion) => ({ calificacion })))) };
}

function graficarDistribucionDisgrafia(estudiantes = []) {
  const canvas = document.getElementById("chartDisgrafia");
  if (!canvas || typeof Chart === "undefined") return;

  const conteo = estudiantes.reduce((acc, estudiante) => {
    const tipo = estudiante.disgrafia || estudiante.tiposDisgrafia?.[0] || "Sin definir";
    acc[tipo] = (acc[tipo] || 0) + 1;
    return acc;
  }, {});

  destruirGrafico("chartDisgrafiaRef");
  window.chartDisgrafiaRef = new Chart(canvas, {
    type: "doughnut",
    data: { labels: Object.keys(conteo), datasets: [{ data: Object.values(conteo) }] }
  });
}

function graficarProgresoMes(evaluaciones = []) {
  const canvas = document.getElementById("chartProgresoMes");
  if (!canvas || typeof Chart === "undefined") return;

  const info = porMes(evaluaciones);
  destruirGrafico("chartProgresoMesRef");
  window.chartProgresoMesRef = new Chart(canvas, {
    type: "line",
    data: { labels: info.labels, datasets: [{ label: "Promedio", data: info.data, borderColor: "#0d6efd", fill: false }] }
  });
}

function graficarComparativa(evaluaciones = []) {
  const canvas = document.getElementById("chartComparativa");
  if (!canvas || typeof Chart === "undefined") return;

  const info = porMes(evaluaciones);
  const actual = info.data[info.data.length - 1] || 0;
  const anterior = info.data[info.data.length - 2] || 0;

  destruirGrafico("chartComparativaRef");
  window.chartComparativaRef = new Chart(canvas, {
    type: "bar",
    data: {
      labels: ["Mes anterior", "Mes actual"],
      datasets: [{ label: "Promedio", data: [anterior, actual], backgroundColor: ["#6c757d", "#198754"] }]
    }
  });
}

function renderHeatmap(estudiantes = [], actividades = []) {
  const contenedor = document.getElementById("heatmapActividades");
  if (!contenedor) return;

  if (!estudiantes.length) {
    contenedor.innerHTML = '<p class="text-muted">Sin estudiantes.</p>';
    return;
  }

  const filas = estudiantes.slice(0, 8).map((estudiante) => {
    const total = actividades.filter((actividad) => !actividad.estudianteId || actividad.estudianteId === estudiante.id).length || 1;
    const completadas = actividades.filter((actividad) => (actividad.estudianteId === estudiante.id || !actividad.estudianteId) && Number(actividad.progreso || 0) >= 100).length;
    const porcentaje = Math.round((completadas / total) * 100);
    return `<tr>
      <td>${estudiante.nombre || "-"}</td>
      <td>${completadas}/${total}</td>
      <td>
        <div class="progress" style="height: 22px;">
          <div class="progress-bar ${porcentaje < 50 ? "bg-danger" : "bg-success"}" style="width:${porcentaje}%">${porcentaje}%</div>
        </div>
      </td>
    </tr>`;
  }).join("");

  contenedor.innerHTML = `
    <table class="table table-sm table-advanced mb-0">
      <thead><tr><th>Estudiante</th><th>Completadas</th><th>Heatmap</th></tr></thead>
      <tbody>${filas}</tbody>
    </table>
  `;
}

function renderActividadReciente(actividades = []) {
  const contenedor = document.getElementById("actividadReciente");
  if (!contenedor) return;

  if (!actividades.length) {
    contenedor.innerHTML = "Sin actividad reciente.";
    return;
  }

  contenedor.innerHTML = actividades.slice(0, 6).map((item) => {
    return `<div class="mb-2"><i class="bi bi-check-circle-fill text-success me-2"></i>${item.nombre || "Actividad"}</div>`;
  }).join("");
}

function actualizarKPIs({ estudiantes, evaluaciones, actividades, recursos }) {
  const hoy = new Date();
  const evalMes = evaluaciones.filter((item) => {
    const segundos = item?.fecha?.seconds || item?.fechaCreacion?.seconds;
    if (!segundos) return false;
    const fecha = new Date(segundos * 1000);
    return fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear();
  });

  const promedioGeneral = promedio(evaluaciones);
  const infoMes = porMes(evaluaciones);
  const mesActual = infoMes.data[infoMes.data.length - 1] || 0;
  const mesAnterior = infoMes.data[infoMes.data.length - 2] || 0;
  const tendencia = mesAnterior ? (((mesActual - mesAnterior) / mesAnterior) * 100) : 0;

  const alerta = estudiantes.filter((estudiante) => {
    const estEval = evaluaciones.filter((evaluacion) => evaluacion.estudianteId === estudiante.id);
    return promedio(estEval) < 5 && estEval.length;
  }).length;

  const mejora = estudiantes.filter((estudiante) => {
    const estEval = evaluaciones.filter((evaluacion) => evaluacion.estudianteId === estudiante.id);
    if (estEval.length < 2) return false;
    const ordenadas = [...estEval].sort((a, b) => (a?.fecha?.seconds || 0) - (b?.fecha?.seconds || 0));
    const inicio = Number(ordenadas[0].calificacion || 0);
    const fin = Number(ordenadas[ordenadas.length - 1].calificacion || 0);
    return inicio > 0 && ((fin - inicio) / inicio) * 100 >= 15;
  }).length;

  const cumplimiento = actividades.length
    ? Math.round((actividades.filter((item) => Number(item.progreso || 0) >= 100).length / actividades.length) * 100)
    : 0;

  document.getElementById("kpiEvaluadosMes").textContent = String(new Set(evalMes.map((item) => item.estudianteId)).size);
  document.getElementById("kpiPromedioGeneral").textContent = String(promedioGeneral);
  document.getElementById("kpiTendencia").textContent = `${tendencia >= 0 ? "+" : ""}${tendencia.toFixed(1)}%`;
  document.getElementById("kpiMejora").textContent = `${estudiantes.length ? Math.round((mejora / estudiantes.length) * 100) : 0}%`;
  document.getElementById("kpiAlertas").textContent = String(alerta);
  document.getElementById("kpiRecursos").textContent = String(recursos.length);
  document.getElementById("kpiCumplimiento").textContent = `${cumplimiento}%`;
}

async function initDashboard() {
  try {
    const [estudiantes, cursos, evaluaciones, actividades, recursos] = await Promise.all([
      obtenerEstudiantes(),
      obtenerCursos(),
      obtenerEvaluaciones(),
      obtenerActividades(),
      obtenerRecursos().catch(() => [])
    ]);

    actualizarKPIs({ estudiantes, cursos, evaluaciones, actividades, recursos });
    renderActividadReciente(actividades);
    renderHeatmap(estudiantes, actividades);
    graficarDistribucionDisgrafia(estudiantes);
    graficarProgresoMes(evaluaciones);
    graficarComparativa(evaluaciones);
  } catch (error) {
    console.error("Error cargando dashboard:", error);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initDashboard);
} else {
  initDashboard();
}
