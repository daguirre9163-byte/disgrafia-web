const estudiantes = [];

export function listarEstudiantes() { return estudiantes; }

export function crearEstudiante(estudiante) {
  const registro = { id: crypto.randomUUID(), fechaCreacion: new Date().toISOString(), ...estudiante };
  estudiantes.push(registro);
  return registro;
}

export function obtenerEstudiante(id) { return estudiantes.find((x) => x.id === id) || null; }

export function actualizarEstudiante(id, cambios = {}) {
  const index = estudiantes.findIndex((x) => x.id === id);
  if (index < 0) return null;
  estudiantes[index] = { ...estudiantes[index], ...cambios };
  return estudiantes[index];
}

export function eliminarEstudiante(id) {
  const index = estudiantes.findIndex((x) => x.id === id);
  if (index < 0) return false;
  estudiantes.splice(index, 1);
  return true;
}

export function historialEvaluaciones(id, evaluaciones = []) {
  return evaluaciones.filter((item) => item.estudianteId === id);
}
