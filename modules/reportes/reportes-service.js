import { obtenerCursos, obtenerEstudiantes, obtenerEvaluaciones } from "../../firebase/firestore.js";

export async function cargarDataReportes() {
  const [cursos, estudiantes, evaluaciones] = await Promise.all([
    obtenerCursos(),
    obtenerEstudiantes(),
    obtenerEvaluaciones()
  ]);

  return { cursos, estudiantes, evaluaciones };
}

export function promedio(lista = []) {
  if (!lista.length) return 0;
  const total = lista.reduce((acc, item) => acc + Number(item.calificacion || item.promedio || 0), 0);
  return Number((total / lista.length).toFixed(2));
}

export function evaluacionesMesActual(evaluaciones = []) {
  const hoy = new Date();
  return evaluaciones.filter((item) => {
    const segundos = item?.fecha?.seconds || item?.fechaCreacion?.seconds;
    if (!segundos) return false;
    const fecha = new Date(segundos * 1000);
    return fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear();
  });
}

export function resumenCurso(estudiantes = [], evaluaciones = []) {
  return estudiantes.map((estudiante) => {
    const evaluacionesEst = evaluaciones.filter((evaluacion) => evaluacion.estudianteId === estudiante.id);
    const promedioEst = promedio(evaluacionesEst);
    return {
      ...estudiante,
      promedio: promedioEst,
      estado: promedioEst < 5 ? "Alerta" : "Estable"
    };
  });
}

export function evolucionMensual(evaluaciones = []) {
  const mapa = {};
  evaluaciones.forEach((item) => {
    const segundos = item?.fecha?.seconds || item?.fechaCreacion?.seconds;
    if (!segundos) return;
    const fecha = new Date(segundos * 1000);
    const llave = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
    mapa[llave] = mapa[llave] || [];
    mapa[llave].push(Number(item.calificacion || 0));
  });

  const meses = Object.keys(mapa).sort();
  return {
    labels: meses,
    data: meses.map((mes) => promedio(mapa[mes].map((calificacion) => ({ calificacion }))))
  };
}
