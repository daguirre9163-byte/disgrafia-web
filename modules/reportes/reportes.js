import { cargarDataReportes, promedio, resumenCurso, evolucionMensual, evaluacionesMesActual } from "./reportes-service.js";
import { registrarNotificacion } from "../../js/notificaciones.js";

let data = { cursos: [], estudiantes: [], evaluaciones: [] };

function destruir(nombre) {
  if (window[nombre]) {
    window[nombre].destroy();
  }
}

function renderTabla(items = []) {
  const body = document.getElementById("tablaReporteCursoBody");
  if (!body) return;
  body.innerHTML = items.map((item) => `
    <tr>
      <td>${item.nombre || "-"}</td>
      <td>${item.nivel || "-"}</td>
      <td>${item.disgrafia || "-"}</td>
      <td>${item.promedio.toFixed(2)}</td>
      <td><span class="badge ${item.estado === "Alerta" ? "bg-danger" : "bg-success"}">${item.estado}</span></td>
    </tr>
  `).join("");
}

function renderKPIs(resumen = []) {
  const bajo = resumen.filter((item) => item.promedio < 5).length;
  const top = [...resumen].sort((a, b) => b.promedio - a.promedio).slice(0, 3);

  document.getElementById("kpiPromedioCurso").textContent = promedio(resumen.map((item) => ({ promedio: item.promedio })));
  document.getElementById("kpiTop").textContent = top.length;
  document.getElementById("kpiBajo").textContent = bajo;
  document.getElementById("kpiEvaluacionesMes").textContent = evaluacionesMesActual(data.evaluaciones).length;
}

function renderGraficos(resumen = []) {
  const canvasEvo = document.getElementById("chartReporteEvolucion");
  const canvasTipo = document.getElementById("chartReporteDisgrafia");
  if (!canvasEvo || !canvasTipo || typeof Chart === "undefined") return;

  const evolucion = evolucionMensual(data.evaluaciones);
  destruir("chartReporteEvolucionRef");
  window.chartReporteEvolucionRef = new Chart(canvasEvo, {
    type: "line",
    data: { labels: evolucion.labels, datasets: [{ label: "Promedio mensual", data: evolucion.data, borderColor: "#0d6efd", fill: false }] },
    options: { responsive: true }
  });

  const tipos = resumen.reduce((acc, item) => {
    const tipo = item.disgrafia || "Sin definir";
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

function llenarSelects() {
  const estudiantesSel = document.getElementById("reporteEstudianteSelect");
  const cursosSel = document.getElementById("reporteCursoSelect");

  estudiantesSel.innerHTML = '<option value="">Todos los estudiantes</option>' + data.estudiantes
    .map((item) => `<option value="${item.id}">${item.nombre || ""}</option>`).join("");

  cursosSel.innerHTML = '<option value="">Todos los cursos</option>' + data.cursos
    .map((item) => `<option value="${item.id}">${item.nombre || "Curso"} ${item.paralelo || ""}</option>`).join("");
}

function exportarCSV(resumen) {
  const contenido = window.Papa.unparse(resumen.map((item) => ({
    estudiante: item.nombre || "",
    nivel: item.nivel || "",
    disgrafia: item.disgrafia || "",
    promedio: item.promedio,
    estado: item.estado
  })));
  const blob = new Blob([contenido], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "reporte-curso.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function exportarExcel(resumen) {
  const worksheet = window.XLSX.utils.json_to_sheet(resumen.map((item) => ({
    Estudiante: item.nombre || "",
    Nivel: item.nivel || "",
    Disgrafia: item.disgrafia || "",
    Promedio: item.promedio,
    Estado: item.estado
  })));

  const workbook = window.XLSX.utils.book_new();
  window.XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte");
  window.XLSX.writeFile(workbook, "reporte-curso.xlsx");
}

function exportarPDF(resumen) {
  const doc = new window.jspdf.jsPDF();
  doc.setFontSize(16);
  doc.text("SIGEDIS - Reporte Avanzado", 14, 16);
  doc.setFontSize(10);
  doc.text(`Fecha: ${new Date().toLocaleDateString("es-EC")}`, 14, 22);

  let y = 30;
  resumen.slice(0, 18).forEach((item) => {
    doc.text(`${item.nombre || "-"} | ${item.promedio.toFixed(2)} | ${item.estado}`, 14, y);
    y += 6;
  });

  doc.save("reporte-curso.pdf");
}

async function init() {
  data = await cargarDataReportes();
  llenarSelects();
  const resumen = resumenCurso(data.estudiantes, data.evaluaciones);
  renderKPIs(resumen);
  renderTabla(resumen);
  renderGraficos(resumen);

  document.getElementById("btnExportarCSV")?.addEventListener("click", async () => {
    exportarCSV(resumen);
    await registrarNotificacion({ mensaje: "Reporte exportado en CSV", tipo: "info" });
  });

  document.getElementById("btnExportarExcel")?.addEventListener("click", async () => {
    exportarExcel(resumen);
    await registrarNotificacion({ mensaje: "Reporte exportado en Excel", tipo: "success" });
  });

  document.getElementById("btnExportarPDF")?.addEventListener("click", async () => {
    exportarPDF(resumen);
    await registrarNotificacion({ mensaje: "Reporte exportado en PDF", tipo: "success" });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
