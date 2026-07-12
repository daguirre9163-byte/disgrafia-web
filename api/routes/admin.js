import { ok } from '../utils/respuestas.js';
import { obtenerLogs } from '../middleware/auditoria.js';

const instituciones = [];
const usuarios = [];
const configuracion = {
  limiteEstudiantesPorDocente: 50,
  limiteRecursos: 500,
  limiteAlmacenamientoMb: 10240,
  duracionSesionMinutos: 60,
  politicaPassword: 'min8-mayus-numero',
  rateLimiting: '100 req/min por usuario'
};

export const adminRoutes = {
  'GET /api/v1/admin/usuarios': () => ok(usuarios),
  'GET /api/v1/admin/instituciones': () => ok(instituciones),
  'GET /api/v1/admin/auditoría': () => ok(obtenerLogs()),
  'GET /api/v1/admin/configuración': () => ok(configuracion),
  'PUT /api/v1/admin/configuración': ({ body }) => {
    Object.assign(configuracion, body || {});
    return ok(configuracion, 'Configuración actualizada');
  }
};
