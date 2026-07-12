const evaluaciones = [];

export function listarEvaluaciones() { return evaluaciones; }

export function crearEvaluacion(evaluacion) {
  const registro = { id: crypto.randomUUID(), fechaCreacion: new Date().toISOString(), ...evaluacion };
  evaluaciones.push(registro);
  return registro;
}

export function obtenerEvaluacion(id) { return evaluaciones.find((x) => x.id === id) || null; }

export function actualizarEvaluacion(id, cambios = {}) {
  const index = evaluaciones.findIndex((x) => x.id === id);
  if (index < 0) return null;
  evaluaciones[index] = { ...evaluaciones[index], ...cambios };
  return evaluaciones[index];
}

export function eliminarEvaluacion(id) {
  const index = evaluaciones.findIndex((x) => x.id === id);
  if (index < 0) return false;
  evaluaciones.splice(index, 1);
  return true;
}

export function estadisticasEvaluaciones() {
  const total = evaluaciones.length;
  const promedio = total ? evaluaciones.reduce((acc, item) => acc + Number(item.nota || 0), 0) / total : 0;
  const porTipo = evaluaciones.reduce((acc, item) => {
    const tipo = item.tipoDisgrafia || 'sin-definir';
    acc[tipo] = (acc[tipo] || 0) + 1;
    return acc;
  }, {});
  return { total, promedio: Number(promedio.toFixed(2)), porTipo };
}
