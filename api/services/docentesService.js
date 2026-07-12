const docentes = [];

export function listarDocentes() {
  return docentes;
}

export function crearDocente(docente) {
  const registro = {
    id: crypto.randomUUID(),
    estado: 'activo',
    estudiantesAsignados: 0,
    evaluacionesRealizadas: 0,
    fechaRegistro: new Date().toISOString(),
    ultimoAcceso: null,
    ...docente
  };
  docentes.push(registro);
  return registro;
}

export function obtenerDocente(id) {
  return docentes.find((x) => x.id === id) || null;
}

export function actualizarDocente(id, cambios = {}) {
  const idx = docentes.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  docentes[idx] = { ...docentes[idx], ...cambios };
  return docentes[idx];
}

export function eliminarDocente(id) {
  const idx = docentes.findIndex((x) => x.id === id);
  if (idx < 0) return false;
  docentes.splice(idx, 1);
  return true;
}
