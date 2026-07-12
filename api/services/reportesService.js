export function reporteDocentes(docentes = []) {
  return docentes.map((d) => ({
    id: d.id,
    nombre: d.nombre,
    institucion: d.institucion,
    estado: d.estado,
    evaluaciones: d.evaluacionesRealizadas
  }));
}

export function reporteEstudiantes(estudiantes = []) {
  return estudiantes.map((e) => ({
    id: e.id,
    nombre: e.nombre,
    nivel: e.nivel,
    promedio: e.promedio || 0
  }));
}

export function reporteEvaluaciones(evaluaciones = []) {
  return evaluaciones.map((e) => ({
    id: e.id,
    estudianteId: e.estudianteId,
    tipo: e.tipoDisgrafia,
    nota: e.nota,
    fecha: e.fechaCreacion
  }));
}

export function reporteUso({ docentes = [], estudiantes = [], evaluaciones = [] } = {}) {
  return {
    totalDocentes: docentes.length,
    totalEstudiantes: estudiantes.length,
    totalEvaluaciones: evaluaciones.length,
    tasaUsoPromedio: docentes.length ? Number((evaluaciones.length / docentes.length).toFixed(2)) : 0
  };
}

export function exportarReporte(payload = {}) {
  return {
    exportadoEn: new Date().toISOString(),
    formato: payload.formato || 'csv',
    modulo: payload.modulo || 'general',
    registros: payload.registros || []
  };
}
