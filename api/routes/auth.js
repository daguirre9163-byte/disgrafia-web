import { AppError } from '../utils/errores.js';
import { ok } from '../utils/respuestas.js';
import { crearParTokens, verificarToken } from '../utils/jwt.js';

export const authRoutes = {
  'POST /api/v1/auth/login': ({ body }) => {
    if (!body?.email || !body?.password) {
      throw new AppError('VALIDATION_ERROR', 'Email y contraseña son obligatorios', 400);
    }
    const payload = { uid: body.uid || crypto.randomUUID(), email: body.email, rol: body.rol || 'docente', permisos: body.permisos || [] };
    return ok(crearParTokens(payload), 'Login exitoso');
  },
  'POST /api/v1/auth/logout': () => ok({}, 'Logout exitoso'),
  'POST /api/v1/auth/refresh': ({ body }) => {
    const token = body?.refreshToken;
    if (!token) throw new AppError('VALIDATION_ERROR', 'refreshToken requerido', 400);
    const decoded = verificarToken(token);
    return ok(crearParTokens({ uid: decoded.uid, email: decoded.email, rol: decoded.rol, permisos: decoded.permisos || [] }), 'Token renovado');
  },
  'POST /api/v1/auth/cambiar-contraseña': ({ body, user }) => {
    if (!user?.uid) throw new AppError('UNAUTHENTICATED', 'No autenticado', 401);
    if (!body?.actual || !body?.nueva) throw new AppError('VALIDATION_ERROR', 'Debes enviar contraseña actual y nueva', 400);
    return ok({}, 'Contraseña actualizada');
  }
};
