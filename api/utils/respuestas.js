export function ok(data = {}, message = 'Operación exitosa') {
  return { success: true, data, message };
}

export function fail(error = 'ERROR', message = 'Ocurrió un error', statusCode = 500) {
  return { success: false, error, message, statusCode };
}

export function paginated(data = [], page = 1, pageSize = 20, total = data.length) {
  return {
    success: true,
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize))
    }
  };
}
