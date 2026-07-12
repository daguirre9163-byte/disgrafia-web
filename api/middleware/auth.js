import { verificarToken } from '../utils/jwt.js';
import { AppError } from '../utils/errores.js';

export function requireAuth(context) {
  const authHeader = context.headers?.authorization || context.headers?.Authorization || '';
  const [, token] = authHeader.split(' ');
  if (!token) throw new AppError('UNAUTHENTICATED', 'Token no proporcionado', 401);
  context.user = verificarToken(token);
  return context.user;
}

export function requireRole(context, allowed = []) {
  if (!context.user) throw new AppError('UNAUTHENTICATED', 'Usuario no autenticado', 401);
  if (!allowed.includes(context.user.rol)) {
    throw new AppError('PERMISSION_DENIED', 'No tienes permisos para esta acción', 403);
  }
}
