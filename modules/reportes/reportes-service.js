import {
  obtenerCursos,
  obtenerParalelos,
  obtenerEstudiantes,
  obtenerEvaluaciones
} from "../../firebase/firestore.js";

export async function cargarDataReportes() {
  const [cursos, paralelos, estudiantes, evaluaciones] = await Promise.all([
    obtenerCursos(),
    obtenerParalelos(),
    obtenerEstudiantes(),
    obtenerEvaluaciones()
  ]);

  return { cursos, paralelos, estudiantes, evaluaciones };
}

export function promedio(lista = []) {
  if (!lista.length) return 0;
  const total = lista.reduce((acc, item) => acc + Number(item.calificacion || item.promedio || 0), 0);
  return Number((total / lista.length).toFixed(2));
}

export function evaluacionesMesActual(evaluaciones = []) {
  const hoy = new Date();
  return evaluaciones.filter((item) => {
    const segundos = item?.fecha?.seconds || item?.fechaCreacion?.seconds || item?.createdAt?.seconds;
    if (!segundos) return false;
    const fecha = new Date(segundos * 1000);
    return fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear();
  });
}

export function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return null;
  const fecha = new Date(fechaNacimiento);
  if (Number.isNaN(fecha.getTime())) return null;

  const hoy = new Date();
  let edad = hoy.getFullYear() - fecha.getFullYear();
  const ajuste =
    hoy.getMonth() < fecha.getMonth() ||
    (hoy.getMonth() === fecha.getMonth() && hoy.getDate() < fecha.getDate());

  if (ajuste) edad -= 1;
  return edad;
}

export function rangoEdad(edad) {
  if (edad === null || edad === undefined) return "Sin dato";
  if (edad < 10) return "Menor de 10";
  if (edad <= 14) return "10 a 14";
  return "15 o más";
}

export function resumenCurso(estudiantes = [], evaluaciones = [], cursos = [], paralelos = []) {
  return estudiantes.map((estudiante) => {
    const evaluacionesEst = evaluaciones.filter((evaluacion) => evaluacion.estudianteId === estudiante.id);
    const promedioEst = promedio(evaluacionesEst);
    const ultimaEvaluacion = evaluacionesEst
      .map((item) => item?.fecha?.seconds || item?.fechaCreacion?.seconds || item?.createdAt?.seconds || 0)
      .sort((a, b) => b - a)[0] || 0;
    const curso = cursos.find((item) => item.id === estudiante.cursoId);
    const paralelo = paralelos.find((item) => item.id === estudiante.paraleloId);
    const nombre = `${estudiante.nombres || estudiante.nombre || ""} ${estudiante.apellidos || estudiante.apellido || ""}`.trim();

    return {
      ...estudiante,
      nombre,
      cursoNombre: curso?.nombre || "Sin curso",
      paraleloNombre: paralelo?.nombre || "Sin paralelo",
      promedio: promedioEst,
      edad: calcularEdad(estudiante.fechaNacimiento),
      rangoEdad: rangoEdad(calcularEdad(estudiante.fechaNacimiento)),
      ultimaEvaluacion,
      estadoReporte: promedioEst < 5 ? "Alerta" : "Estable"
    };
  });
}

export function evolucionMensual(evaluaciones = []) {
  const mapa = {};
  evaluaciones.forEach((item) => {
    const segundos = item?.fecha?.seconds || item?.fechaCreacion?.seconds || item?.createdAt?.seconds;
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
