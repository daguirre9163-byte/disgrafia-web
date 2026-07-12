import { AppError } from '../utils/errores.js';
import { ok, paginated } from '../utils/respuestas.js';
import { crearEvaluacion, eliminarEvaluacion, estadisticasEvaluaciones, listarEvaluaciones, obtenerEvaluacion, actualizarEvaluacion } from '../services/evaluacionesService.js';

export const evaluacionesRoutes = {
  'GET /api/v1/evaluaciones': () => paginated(listarEvaluaciones()),
  'POST /api/v1/evaluaciones': ({ body }) => ok(crearEvaluacion(body), 'Evaluación creada'),
  'GET /api/v1/evaluaciones/:id': ({ params }) => {
    const evaluacion = obtenerEvaluacion(params.id);
    if (!evaluacion) throw new AppError('NOT_FOUND', 'Evaluación no encontrada', 404);
    return ok(evaluacion);
  },
  'PUT /api/v1/evaluaciones/:id': ({ params, body }) => {
    const evaluacion = actualizarEvaluacion(params.id, body);
    if (!evaluacion) throw new AppError('NOT_FOUND', 'Evaluación no encontrada', 404);
    return ok(evaluacion, 'Evaluación actualizada');
  },
  'DELETE /api/v1/evaluaciones/:id': ({ params }) => {
    if (!eliminarEvaluacion(params.id)) throw new AppError('NOT_FOUND', 'Evaluación no encontrada', 404);
    return ok({}, 'Evaluación eliminada');
  },
  'GET /api/v1/evaluaciones/estadisticas': () => ok(estadisticasEvaluaciones())
};
