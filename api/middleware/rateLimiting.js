import { AppError } from '../utils/errores.js';

const store = new Map();

export function checkRateLimit(context) {
  const userKey = context.user?.uid || context.ip || 'anon';
  const isAuth = Boolean(context.user?.uid);
  const limit = isAuth ? 100 : 10;
  const windowMs = 60 * 1000;

  const now = Date.now();
  const bucket = store.get(userKey) || { count: 0, resetAt: now + windowMs };
  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + windowMs;
  }
  bucket.count += 1;
  store.set(userKey, bucket);

  context.responseHeaders = {
    ...context.responseHeaders,
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(Math.max(0, limit - bucket.count))
  };

  if (bucket.count > limit) {
    throw new AppError('RATE_LIMITED', 'Demasiadas solicitudes', 429);
  }
}
