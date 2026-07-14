import {
  cargarDataReportes,
  promedio,
  resumenCurso,
  evolucionMensual,
  evaluacionesMesActual
} from "./reportes-service.js";
import { registrarNotificacion } from "../../js/notificaciones.js";

let data = { cursos: [], paralelos: [], estudiantes: [], evaluaciones: [] };

function obtenerDiagnostico(item = {}) {
  return item.disgrafia || item.diagnostico || "Sin definir";
}

function destruir(nombre) {
  if (window[nombre]) {
    window[nombre].destroy();
  }
}

function obtenerResumenFiltrado() {
  const resumen = resumenCurso(data.estudiantes, data.evaluaciones, data.cursos, data.paralelos);
  const cursoId = document.getElementById("reporteCursoSelect")?.value || "";
  const paraleloId = document.getElementById("reporteParaleloSelect")?.value || "";
  const sexo = document.getElementById("reporteSexoSelect")?.value || "";
  const estado = document.getElementById("reporteEstadoSelect")?.value || "";
  const edad = document.getElementById("reporteEdadSelect")?.value || "";
  const diagnostico = document.getElementById("reporteDiagnosticoSelect")?.value || "";
  const fechaDesde = document.getElementById("reporteFechaDesde")?.value || "";
  const fechaHasta = document.getElementById("reporteFechaHasta")?.value || "";

  return resumen.filter((item) => {
    const coincideCurso = !cursoId || item.cursoId === cursoId;
    const coincideParalelo = !paraleloId || item.paraleloId === paraleloId;
    const coincideSexo = !sexo || item.sexo === sexo;
    const coincideEstado = !estado || item.estado === estado;
    const coincideEdad = !edad || item.rangoEdad === edad;
    const coincideDiagnostico = !diagnostico || obtenerDiagnostico(item) === diagnostico;

    const fecha = item.ultimaEvaluacion ? new Date(item.ultimaEvaluacion * 1000) : null;
    const coincideDesde = !fechaDesde || (fecha && fecha >= new Date(`${fechaDesde}T00:00:00`));
    const coincideHasta = !fechaHasta || (fecha && fecha <= new Date(`${fechaHasta}T23:59:59`));

    return coincideCurso && coincideParalelo && coincideSexo && coincideEstado && coincideEdad && coincideDiagnostico && coincideDesde && coincideHasta;
  });
}

function renderTabla(items = []) {
  const body = document.getElementById("tablaReporteCursoBody");
  if (!body) return;

  if (!items.length) {
    body.innerHTML = '<tr><td colspan="8" class="text-center text-muted">No hay datos para los filtros seleccionados.</td></tr>';
    return;
  }

  body.innerHTML = items.map((item) => `
    <tr>
      <td>${item.nombre || "-"}</td>
      <td>${item.cursoNombre || "-"}</td>
      <td>${item.paraleloNombre || "-"}</td>
      <td>${item.sexo || "-"}</td>
      <td>${item.edad ?? "-"}</td>
      <td>${obtenerDiagnostico(item)}</td>
      <td>${item.promedio.toFixed(2)}</td>
      <td><span class="badge ${item.estadoReporte === "Alerta" ? "bg-danger" : "bg-success"}">${item.estadoReporte}</span></td>
    </tr>
  `).join("");
}

function renderKPIs(resumen = []) {
  const bajo = resumen.filter((item) => item.promedio < 5).length;
  document.getElementById("kpiPromedioCurso").textContent = promedio(resumen.map((item) => ({ promedio: item.promedio })));
  document.getElementById("kpiTop").textContent = resumen.length;
  document.getElementById("kpiBajo").textContent = bajo;
  document.getElementById("kpiEvaluacionesMes").textContent = evaluacionesMesActual(data.evaluaciones).length;
}

function renderGraficos(resumen = []) {
  const canvasEvo = document.getElementById("chartReporteEvolucion");
  const canvasTipo = document.getElementById("chartReporteDisgrafia");
  if (!canvasEvo || !canvasTipo || typeof Chart === "undefined") return;

  const idsEstudiantes = new Set(resumen.map((item) => item.id));
  const evaluacionesFiltradas = data.evaluaciones.filter((evaluacion) => idsEstudiantes.has(evaluacion.estudianteId));
  const evolucion = evolucionMensual(evaluacionesFiltradas);

  destruir("chartReporteEvolucionRef");
  window.chartReporteEvolucionRef = new Chart(canvasEvo, {
    type: "line",
    data: {
      labels: evolucion.labels,
      datasets: [{ label: "Promedio mensual", data: evolucion.data, borderColor: "#0d6efd", fill: false }]
    },
    options: { responsive: true }
  });

  const tipos = resumen.reduce((acc, item) => {
    const tipo = obtenerDiagnostico(item);
    acc[tipo] = (acc[tipo] || 0) + 1;
    return acc;
  }, {});

  destruir("chartReporteDisgrafiaRef");
  window.chartReporteDisgrafiaRef = new Chart(canvasTipo, {
    type: "pie",
    data: { labels: Object.keys(tipos), datasets: [{ data: Object.values(tipos) }] },
    options: { responsive: true }
  });
}

function llenarParalelosPorCurso(cursoId = "") {
  const select = document.getElementById("reporteParaleloSelect");
  if (!select) return;

  const paralelos = data.paralelos
    .filter((item) => !cursoId || item.cursoId === cursoId)
    .sort((a, b) => String(a.nombre || "").localeCompare(String(b.nombre || ""), "es"));

  select.innerHTML = '<option value="">Todos los paralelos</option>' + paralelos
    .map((item) => `<option value="${item.id}">${item.nombre || ""}</option>`)
    .join("");
}

function llenarSelects() {
  const cursosSel = document.getElementById("reporteCursoSelect");

  cursosSel.innerHTML = '<option value="">Todos los cursos</option>' + data.cursos
    .map((item) => `<option value="${item.id}">${item.nombre || "Curso"}</option>`)
    .join("");

  llenarParalelosPorCurso();
}

function exportarCSV(resumen) {
  const contenido = window.Papa.unparse(resumen.map((item) => ({
    estudiante: item.nombre || "",
    curso: item.cursoNombre || "",
    paralelo: item.paraleloNombre || "",
    sexo: item.sexo || "",
    edad: item.edad ?? "",
    disgrafia: obtenerDiagnostico(item),
    promedio: item.promedio,
    estado: item.estadoReporte
  })));
  const blob = new Blob([contenido], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "reporte-curso-paralelo.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function exportarExcel(resumen) {
  const worksheet = window.XLSX.utils.json_to_sheet(resumen.map((item) => ({
    Estudiante: item.nombre || "",
    Curso: item.cursoNombre || "",
    Paralelo: item.paraleloNombre || "",
    Sexo: item.sexo || "",
    Edad: item.edad ?? "",
    Disgrafia: obtenerDiagnostico(item),
    Promedio: item.promedio,
    Estado: item.estadoReporte
  })));

  const workbook = window.XLSX.utils.book_new();
  window.XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte");
  window.XLSX.writeFile(workbook, "reporte-curso-paralelo.xlsx");
}

function exportarPDF(resumen) {
  const doc = new window.jspdf.jsPDF();
  doc.setFontSize(16);
  doc.text("SIGEDIS - Reporte Académico", 14, 16);
  doc.setFontSize(10);
  doc.text(`Fecha: ${new Date().toLocaleDateString("es-EC")}`, 14, 22);

  let y = 30;
  resumen.slice(0, 16).forEach((item) => {
    doc.text(`${item.nombre || "-"} | ${item.cursoNombre || "-"} | ${item.paraleloNombre || "-"} | ${item.promedio.toFixed(2)}`, 14, y);
    y += 6;
  });

  doc.save("reporte-curso-paralelo.pdf");
}

function aplicarFiltros() {
  const resumen = obtenerResumenFiltrado();
  renderKPIs(resumen);
  renderTabla(resumen);
  renderGraficos(resumen);
  return resumen;
}

async function init() {
  data = await cargarDataReportes();
  llenarSelects();
  let resumenActual = aplicarFiltros();

  document.getElementById("reporteCursoSelect")?.addEventListener("change", (event) => {
    llenarParalelosPorCurso(event.target.value);
    resumenActual = aplicarFiltros();
  });

  [
    "reporteParaleloSelect",
    "reporteSexoSelect",
    "reporteEstadoSelect",
    "reporteEdadSelect",
    "reporteDiagnosticoSelect",
    "reporteFechaDesde",
    "reporteFechaHasta"
  ].forEach((id) => {
    document.getElementById(id)?.addEventListener("change", () => {
      resumenActual = aplicarFiltros();
    });
  });

  document.getElementById("btnExportarCSV")?.addEventListener("click", async () => {
    exportarCSV(resumenActual);
    await registrarNotificacion({ mensaje: "Reporte exportado en CSV", tipo: "info" });
  });

  document.getElementById("btnExportarExcel")?.addEventListener("click", async () => {
    exportarExcel(resumenActual);
    await registrarNotificacion({ mensaje: "Reporte exportado en Excel", tipo: "success" });
  });

  document.getElementById("btnExportarPDF")?.addEventListener("click", async () => {
    exportarPDF(resumenActual);
    await registrarNotificacion({ mensaje: "Reporte exportado en PDF", tipo: "success" });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
