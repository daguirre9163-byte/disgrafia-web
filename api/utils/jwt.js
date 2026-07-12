import { createHmac, timingSafeEqual } from 'node:crypto';

const DEFAULT_SECRET = process.env.JWT_SECRET || 'replace-with-secure-secret';
const DEFAULT_EXP_SECONDS = 60 * 60;
const DEFAULT_REFRESH_SECONDS = 7 * 24 * 60 * 60;

function toBase64Url(json) {
  return Buffer.from(JSON.stringify(json)).toString('base64url');
}

function sign(input, secret = DEFAULT_SECRET) {
  return createHmac('sha256', secret).update(input).digest('base64url');
}

export function crearToken(payload, expiresIn = DEFAULT_EXP_SECONDS, secret = DEFAULT_SECRET) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const body = { ...payload, iat: now, exp: now + expiresIn };
  const base = `${toBase64Url(header)}.${toBase64Url(body)}`;
  return `${base}.${sign(base, secret)}`;
}

export function crearParTokens(payload) {
  return {
    accessToken: crearToken(payload, DEFAULT_EXP_SECONDS),
    refreshToken: crearToken(payload, DEFAULT_REFRESH_SECONDS)
  };
}

export function verificarToken(token, secret = DEFAULT_SECRET) {
  if (!token || typeof token !== 'string' || token.split('.').length !== 3) {
    throw new Error('Token inválido');
  }
  const [header, payload, signature] = token.split('.');
  const input = `${header}.${payload}`;
  const expected = sign(input, secret);
  const valid = timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!valid) throw new Error('Firma inválida');
  const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  if (!decoded.exp || decoded.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token expirado');
  }
  return decoded;
}
