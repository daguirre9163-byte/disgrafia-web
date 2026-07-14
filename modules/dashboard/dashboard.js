import {
  obtenerCursos,
  obtenerParalelos,
  obtenerEstudiantes,
  obtenerEvaluaciones,
  obtenerActividades
} from "../../firebase/firestore.js";

function destruirGrafico(nombre) {
  if (window[nombre]) {
    window[nombre].destroy();
  }
}

function graficarCurso(estudiantes = [], cursos = []) {
  const canvas = document.getElementById("chartCursos");
  if (!canvas || typeof Chart === "undefined") return;

  const conteo = cursos.map((curso) => ({
    nombre: curso.nombre || "Curso",
    total: estudiantes.filter((estudiante) => estudiante.cursoId === curso.id).length
  }));

  destruirGrafico("chartCursosRef");
  window.chartCursosRef = new Chart(canvas, {
    type: "bar",
    data: {
      labels: conteo.map((item) => item.nombre),
      datasets: [{ label: "Estudiantes", data: conteo.map((item) => item.total), backgroundColor: "#0d6efd" }]
    },
    options: { responsive: true }
  });
}

function graficarSexo(estudiantes = []) {
  const canvas = document.getElementById("chartSexo");
  if (!canvas || typeof Chart === "undefined") return;

  const conteo = estudiantes.reduce((acc, estudiante) => {
    const sexo = estudiante.sexo || "Sin dato";
    acc[sexo] = (acc[sexo] || 0) + 1;
    return acc;
  }, {});

  destruirGrafico("chartSexoRef");
  window.chartSexoRef = new Chart(canvas, {
    type: "pie",
    data: { labels: Object.keys(conteo), datasets: [{ data: Object.values(conteo) }] }
  });
}

function graficarDiagnostico(estudiantes = []) {
  const canvas = document.getElementById("chartDiagnostico");
  if (!canvas || typeof Chart === "undefined") return;

  const conteo = estudiantes.reduce((acc, estudiante) => {
    const tipo = estudiante.disgrafia || estudiante.diagnostico || "Sin definir";
    acc[tipo] = (acc[tipo] || 0) + 1;
    return acc;
  }, {});

  destruirGrafico("chartDiagnosticoRef");
  window.chartDiagnosticoRef = new Chart(canvas, {
    type: "doughnut",
    data: { labels: Object.keys(conteo), datasets: [{ data: Object.values(conteo) }] }
  });
}

function renderParalelos(paralelos = [], estudiantes = [], cursos = []) {
  const contenedor = document.getElementById("heatmapActividades");
  if (!contenedor) return;

  if (!paralelos.length) {
    contenedor.innerHTML = '<p class="text-muted">Sin paralelos registrados.</p>';
    return;
  }

  const filas = paralelos.map((paralelo) => {
    const curso = cursos.find((item) => item.id === paralelo.cursoId);
    const total = estudiantes.filter((estudiante) => estudiante.paraleloId === paralelo.id).length;

    return `<tr>
      <td>${paralelo.nombre || "-"}</td>
      <td>${curso?.nombre || "Sin curso"}</td>
      <td>${total}</td>
      <td><span class="badge ${paralelo.estado === "inactivo" ? "bg-secondary" : "bg-success"}">${paralelo.estado || "activo"}</span></td>
    </tr>`;
  }).join("");

  contenedor.innerHTML = `
    <table class="table table-sm table-advanced mb-0">
      <thead><tr><th>Paralelo</th><th>Curso</th><th>Estudiantes</th><th>Estado</th></tr></thead>
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

function actualizarKPIs({ estudiantes, cursos, paralelos, evaluaciones }) {
  const hoy = new Date();
  const evalMes = evaluaciones.filter((item) => {
    const segundos = item?.fecha?.seconds || item?.fechaCreacion?.seconds || item?.createdAt?.seconds;
    if (!segundos) return false;
    const fecha = new Date(segundos * 1000);
    return fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear();
  });

  const conteoCursos = cursos.map((curso) => ({
    nombre: curso.nombre || "Curso",
    total: estudiantes.filter((estudiante) => estudiante.cursoId === curso.id).length
  })).sort((a, b) => b.total - a.total);

  const conteoParalelos = paralelos.map((paralelo) => ({
    nombre: `${paralelo.nombre || "Paralelo"} · ${(cursos.find((curso) => curso.id === paralelo.cursoId)?.nombre || "Sin curso")}`,
    total: estudiantes.filter((estudiante) => estudiante.paraleloId === paralelo.id).length
  })).sort((a, b) => b.total - a.total);

  document.getElementById("kpiTotalCursos").textContent = String(cursos.length);
  document.getElementById("kpiTotalParalelos").textContent = String(paralelos.length);
  document.getElementById("kpiTotalEstudiantes").textContent = String(estudiantes.length);
  document.getElementById("kpiCursoTop").textContent = conteoCursos[0]?.total ? `${conteoCursos[0].nombre} (${conteoCursos[0].total})` : "-";
  document.getElementById("kpiParaleloTop").textContent = conteoParalelos[0]?.total ? `${conteoParalelos[0].nombre} (${conteoParalelos[0].total})` : "-";
  document.getElementById("kpiEvaluadosMes").textContent = String(new Set(evalMes.map((item) => item.estudianteId)).size);
}

async function initDashboard() {
  try {
    const [estudiantes, cursos, paralelos, evaluaciones, actividades] = await Promise.all([
      obtenerEstudiantes(),
      obtenerCursos(),
      obtenerParalelos(),
      obtenerEvaluaciones(),
      obtenerActividades()
    ]);

    actualizarKPIs({ estudiantes, cursos, paralelos, evaluaciones, actividades });
    renderActividadReciente(actividades);
    renderParalelos(paralelos, estudiantes, cursos);
    graficarCurso(estudiantes, cursos);
    graficarSexo(estudiantes);
    graficarDiagnostico(estudiantes);
  } catch (error) {
    console.error("Error cargando dashboard:", error);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initDashboard);
} else {
  initDashboard();
}
