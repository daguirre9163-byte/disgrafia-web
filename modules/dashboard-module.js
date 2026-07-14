import {
  obtenerEstudiantes,
  obtenerPlanesIntervención,
  obtenerEvaluaciones
} from '../firebase/firestore.js';
import { obtenerRecursos } from '../services/recursos-service.js';

function contarCompletadas(actividades = []) {
  const total = actividades.length;
  if (!total) return 0;
  const completadas = actividades.filter((a) => a.completado || a.estado === 'completada').length;
  return Math.round((completadas / total) * 100);
}

export async function obtenerEstadisticasDashboard() {
  const [planes, estudiantes, evaluaciones, recursos] = await Promise.all([
    obtenerPlanesIntervención(),
    obtenerEstudiantes(),
    obtenerEvaluaciones(),
    obtenerRecursos()
  ]);

  const planesActivos = planes.filter((plan) => (plan.estado || 'activo') === 'activo');
  const estudiantesActivos = new Set(planesActivos.map((plan) => plan.estudianteId).filter(Boolean));

  const recursoTop = recursos
    .slice()
    .sort((a, b) => (b.descargado || 0) - (a.descargado || 0))[0];

  const promedioProgreso = planes.length
    ? Math.round(planes.reduce((acc, plan) => acc + contarCompletadas(plan.actividades || []), 0) / planes.length)
    : 0;

  return {
    planesCreados: planes.length,
    estudiantesConIntervencionActiva: estudiantesActivos.size,
    recursoMasDescargado: recursoTop ? `${recursoTop.titulo} (${recursoTop.descargado})` : '-',
    progresoEstudiantes: `${promedioProgreso}%`,
    totalEstudiantes: estudiantes.length,
    evaluacionesMes: evaluaciones.length
  };
}
