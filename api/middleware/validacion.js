import { AppError } from '../utils/errores.js';

function cleanString(value = '') {
  return String(value).replace(/[<>]/g, '').trim();
}

export function sanitizeBody(body = {}) {
  return Object.fromEntries(Object.entries(body).map(([key, value]) => [
    key,
    typeof value === 'string' ? cleanString(value) : value
  ]));
}

export function validateRequired(body = {}, required = []) {
  for (const field of required) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      throw new AppError('VALIDATION_ERROR', `El campo ${field} es obligatorio`, 400);
    }
  }
}
