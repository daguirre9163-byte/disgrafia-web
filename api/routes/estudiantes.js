import { AppError } from '../utils/errores.js';
import { ok, paginated } from '../utils/respuestas.js';
import { crearEstudiante, eliminarEstudiante, historialEvaluaciones, listarEstudiantes, obtenerEstudiante, actualizarEstudiante } from '../services/estudiantesService.js';
import { listarEvaluaciones } from '../services/evaluacionesService.js';

export const estudiantesRoutes = {
  'GET /api/v1/estudiantes': () => paginated(listarEstudiantes()),
  'POST /api/v1/estudiantes': ({ body }) => ok(crearEstudiante(body), 'Estudiante creado'),
  'GET /api/v1/estudiantes/:id': ({ params }) => {
    const estudiante = obtenerEstudiante(params.id);
    if (!estudiante) throw new AppError('NOT_FOUND', 'Estudiante no encontrado', 404);
    return ok(estudiante);
  },
  'PUT /api/v1/estudiantes/:id': ({ params, body }) => {
    const estudiante = actualizarEstudiante(params.id, body);
    if (!estudiante) throw new AppError('NOT_FOUND', 'Estudiante no encontrado', 404);
    return ok(estudiante, 'Estudiante actualizado');
  },
  'DELETE /api/v1/estudiantes/:id': ({ params }) => {
    if (!eliminarEstudiante(params.id)) throw new AppError('NOT_FOUND', 'Estudiante no encontrado', 404);
    return ok({}, 'Estudiante eliminado');
  },
  'GET /api/v1/estudiantes/:id/evaluaciones': ({ params }) => ok(historialEvaluaciones(params.id, listarEvaluaciones()))
};
