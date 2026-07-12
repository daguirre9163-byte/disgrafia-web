import { ok } from '../utils/respuestas.js';
import { listarDocentes } from '../services/docentesService.js';
import { listarEstudiantes } from '../services/estudiantesService.js';
import { listarEvaluaciones } from '../services/evaluacionesService.js';
import { exportarReporte, reporteDocentes, reporteEstudiantes, reporteEvaluaciones, reporteUso } from '../services/reportesService.js';

export const reportesRoutes = {
  'GET /api/v1/reportes/docentes': () => ok(reporteDocentes(listarDocentes())),
  'GET /api/v1/reportes/estudiantes': () => ok(reporteEstudiantes(listarEstudiantes())),
  'GET /api/v1/reportes/evaluaciones': () => ok(reporteEvaluaciones(listarEvaluaciones())),
  'GET /api/v1/reportes/uso': () => ok(reporteUso({ docentes: listarDocentes(), estudiantes: listarEstudiantes(), evaluaciones: listarEvaluaciones() })),
  'POST /api/v1/reportes/exportar': ({ body }) => ok(exportarReporte(body), 'Reporte exportado')
};
