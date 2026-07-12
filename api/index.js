import { authRoutes } from './routes/auth.js';
import { docentesRoutes } from './routes/docentes.js';
import { estudiantesRoutes } from './routes/estudiantes.js';
import { evaluacionesRoutes } from './routes/evaluaciones.js';
import { reportesRoutes } from './routes/reportes.js';
import { adminRoutes } from './routes/admin.js';
import { requireAuth, requireRole } from './middleware/auth.js';
import { checkRateLimit } from './middleware/rateLimiting.js';
import { sanitizeBody, validateRequired } from './middleware/validacion.js';
import { manejarError } from './utils/errores.js';
import { registrarAuditoria } from './middleware/auditoria.js';

const ROUTES = {
  ...authRoutes,
  ...docentesRoutes,
  ...estudiantesRoutes,
  ...evaluacionesRoutes,
  ...reportesRoutes,
  ...adminRoutes
};

const ADMIN_PREFIXES = ['/api/v1/docentes', '/api/v1/admin'];
const CORS_CONFIG = {
  origins: (process.env.CORS_ALLOWED_ORIGINS || '*').split(',').map((item) => item.trim()),
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  headers: ['Authorization', 'Content-Type']
};

function normalizePath(path) {
  return String(path || '/').replace(/\/+$/, '') || '/';
}

function splitRouteKey(routeKey = '') {
  const [method, ...parts] = routeKey.split(' ');
  return { method, path: normalizePath(parts.join(' ')) };
}

function matchRoute(method, path) {
  const normalized = normalizePath(path);
  for (const [key, handler] of Object.entries(ROUTES)) {
    const route = splitRouteKey(key);
    if (route.method !== method) continue;
    const routeSegments = route.path.split('/');
    const pathSegments = normalized.split('/');
    if (routeSegments.length !== pathSegments.length) continue;
    const params = {};
    let ok = true;
    for (let i = 0; i < routeSegments.length; i += 1) {
      const segment = routeSegments[i];
      if (segment.startsWith(':')) {
        params[segment.slice(1)] = decodeURIComponent(pathSegments[i]);
      } else if (segment !== pathSegments[i]) {
        ok = false;
        break;
      }
    }
    if (ok) return { handler, params };
  }
  return null;
}

export async function handleApiRequest(request = {}) {
  const context = {
    method: request.method || 'GET',
    path: request.path || '/',
    query: request.query || {},
    headers: request.headers || {},
    body: sanitizeBody(request.body || {}),
    ip: request.ip || '127.0.0.1',
    userAgent: request.userAgent || 'unknown',
    responseHeaders: {
      'Access-Control-Allow-Origin': CORS_CONFIG.origins.includes('*') ? '*' : CORS_CONFIG.origins[0] || '*',
      'Access-Control-Allow-Methods': CORS_CONFIG.methods.join(', '),
      'Access-Control-Allow-Headers': CORS_CONFIG.headers.join(', ')
    }
  };

  try {
    const matched = matchRoute(context.method, context.path);
    if (!matched) {
      return { statusCode: 404, headers: context.responseHeaders, body: { success: false, error: 'NOT_FOUND', message: 'Ruta no encontrada', statusCode: 404 } };
    }

    context.params = matched.params;

    if (context.method !== 'OPTIONS') {
      if (!context.path.startsWith('/api/v1/auth')) {
        requireAuth(context);
      }
      checkRateLimit(context);
      if (ADMIN_PREFIXES.some((prefix) => context.path.startsWith(prefix))) {
        requireRole(context, ['admin', 'coordinador', 'admin institucional']);
      }
      if (context.method === 'POST' && context.path === '/api/v1/docentes') {
        validateRequired(context.body, ['email', 'institucion', 'rol']);
      }
    }

    const response = await matched.handler(context);

    registrarAuditoria({
      user: context.user,
      action: `${context.method} ${context.path}`,
      resource: context.path,
      after: context.body,
      ip: context.ip,
      userAgent: context.userAgent,
      estado: 'exito'
    });

    return { statusCode: 200, headers: context.responseHeaders, body: response };
  } catch (error) {
    registrarAuditoria({
      user: context.user,
      action: `${context.method} ${context.path}`,
      resource: context.path,
      after: context.body,
      ip: context.ip,
      userAgent: context.userAgent,
      estado: 'error'
    });
    const handled = manejarError(error);
    return { statusCode: handled.statusCode || 500, headers: context.responseHeaders, body: handled };
  }
}

export function getApiInfo() {
  return {
    baseUrl: '/api/v1',
    version: 'v1',
    auth: 'JWT Bearer',
    cors: CORS_CONFIG
  };
}
