import { AppError } from '../utils/errores.js';
import { ok, paginated } from '../utils/respuestas.js';
import { crearDocente, eliminarDocente, listarDocentes, obtenerDocente, actualizarDocente } from '../services/docentesService.js';

export const docentesRoutes = {
  'GET /api/v1/docentes': () => paginated(listarDocentes()),
  'POST /api/v1/docentes': ({ body }) => ok(crearDocente(body), 'Docente creado'),
  'GET /api/v1/docentes/:id': ({ params }) => {
    const docente = obtenerDocente(params.id);
    if (!docente) throw new AppError('NOT_FOUND', 'Docente no encontrado', 404);
    return ok(docente);
  },
  'PUT /api/v1/docentes/:id': ({ params, body }) => {
    const docente = actualizarDocente(params.id, body);
    if (!docente) throw new AppError('NOT_FOUND', 'Docente no encontrado', 404);
    return ok(docente, 'Docente actualizado');
  },
  'DELETE /api/v1/docentes/:id': ({ params }) => {
    if (!eliminarDocente(params.id)) throw new AppError('NOT_FOUND', 'Docente no encontrado', 404);
    return ok({}, 'Docente eliminado');
  },
  'POST /api/v1/docentes/:id/cambiar-rol': ({ params, body }) => {
    const docente = actualizarDocente(params.id, { rol: body?.rol || 'docente' });
    if (!docente) throw new AppError('NOT_FOUND', 'Docente no encontrado', 404);
    return ok(docente, 'Rol actualizado');
  }
};
