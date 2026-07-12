import { fail } from './respuestas.js';

export class AppError extends Error {
  constructor(code, message, statusCode = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}

export function manejarError(error) {
  if (error instanceof AppError) {
    return fail(error.code, error.message, error.statusCode);
  }
  return fail('INTERNAL_ERROR', 'Error interno del servidor', 500);
}
