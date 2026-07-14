import { auth } from '../firebase/firebase-config.js';
import {
  crearPlanIntervención,
  obtenerPlanesIntervención,
  obtenerPlanIntervención,
  actualizarPlanIntervención,
  eliminarPlanIntervención
} from '../firebase/firestore.js';

let cacheObjetivos = null;
let cacheActividades = null;
const DURACION_ACTIVIDAD_DEFAULT_MINUTOS = 20;

async function cargarObjetivos() {
  if (cacheObjetivos) {
    return cacheObjetivos;
  }

  const response = await fetch('/data/objetivos.json');
  if (!response.ok) {
    console.warn('No fue posible cargar data/objetivos.json. Se usará estructura vacía.');
    cacheObjetivos = { objetivos: {} };
    return cacheObjetivos;
  }

  cacheObjetivos = await response.json();
  return cacheObjetivos;
}

async function cargarActividades() {
  if (cacheActividades) {
    return cacheActividades;
  }

  const response = await fetch('/data/actividades.json');
  if (!response.ok) {
    console.warn('No fue posible cargar data/actividades.json. Se usará estructura vacía.');
    cacheActividades = { actividadesPorObjetivo: {} };
    return cacheActividades;
  }

  cacheActividades = await response.json();
  return cacheActividades;
}

function asegurarArray(valor) {
  return Array.isArray(valor) ? valor : [];
}

function extraerDuracionMinutos(duracion) {
  if (typeof duracion === 'number') {
    return duracion;
  }

  const texto = String(duracion || '');
  const numero = parseInt(texto, 10);
  return Number.isFinite(numero) ? numero : DURACION_ACTIVIDAD_DEFAULT_MINUTOS;
}

function normalizarPlan(plan = {}) {
  return {
    ...plan,
    nombre: plan.nombre || plan.nombrePlan || 'Plan de intervención',
    objetivos: asegurarArray(plan.objetivos),
    actividades: asegurarArray(plan.actividades),
    estudianteId: plan.estudianteId || 'estudiante-general',
    tipoDisgrafia: plan.tipoDisgrafia || plan.tipo || ''
  };
}

function construirPlan(datos = {}) {
  if (!datos.nombre && !datos.nombrePlan) {
    throw new Error('Debes indicar un nombre para el plan.');
  }

  if (!datos.tipoDisgrafia) {
    throw new Error('Debes seleccionar un tipo de disgrafía.');
  }

  return {
    ...datos,
    nombre: datos.nombre || datos.nombrePlan,
    nombrePlan: datos.nombre || datos.nombrePlan,
    createdBy: auth.currentUser?.uid || 'usuario-anonimo',
    estudianteId: datos.estudianteId || 'estudiante-general',
    estado: datos.estado || 'activo',
    objetivos: asegurarArray(datos.objetivos),
    actividades: asegurarArray(datos.actividades)
  };
}

export async function crearPlan(datos = {}) {
  const plan = construirPlan(datos);
  const creado = await crearPlanIntervención(plan);
  return normalizarPlan(creado);
}

export async function obtenerObjetivos(tipoDisgrafia = '') {
  const data = await cargarObjetivos();
  return asegurarArray(data?.objetivos?.[tipoDisgrafia]);
}

export async function generarActividades(objetivos = []) {
  const data = await cargarActividades();
  const mapa = data?.actividadesPorObjetivo || {};

  const actividades = objetivos.flatMap((objetivo) => {
    return asegurarArray(mapa[objetivo]).map((actividad, indice) => ({
      id: `${objetivo}-${indice}-${Date.now()}`,
      objetivo,
      actividad: actividad.actividad,
      duracion: actividad.duracion,
      frecuencia: actividad.frecuencia,
      recursos: asegurarArray(actividad.recursos),
      estado: 'pendiente'
    }));
  });

  if (actividades.length) {
    return actividades;
  }

  return objetivos.map((objetivo, indice) => ({
    id: `auto-${indice}-${Date.now()}`,
    objetivo,
    actividad: `Actividad guiada para ${objetivo}`,
    duracion: '20 minutos',
    frecuencia: '3 veces por semana',
    recursos: ['Cuaderno pautado', 'Lápiz'],
    estado: 'pendiente'
  }));
}

export async function guardarPlan(plan = {}) {
  if (plan?.id) {
    const { id, ...datos } = plan;
    const actualizado = await actualizarPlanIntervención(id, datos);
    return normalizarPlan(actualizado);
  }

  return crearPlan(plan);
}

export async function obtenerPlanesUsuario() {
  const usuarioId = auth.currentUser?.uid;
  const planes = await obtenerPlanesIntervención();
  if (!usuarioId) {
    return planes.map(normalizarPlan);
  }

  return planes
    .filter((plan) => !plan.createdBy || plan.createdBy === usuarioId)
    .map(normalizarPlan);
}

export async function actualizarPlan(id, datos = {}) {
  const actualizado = await actualizarPlanIntervención(id, datos);
  return normalizarPlan(actualizado);
}

export async function eliminarPlan(id) {
  return eliminarPlanIntervención(id);
}

// Compatibilidad con implementación existente en js/planes.js
export const crearPlanServicio = guardarPlan;
export const obtenerPlanesServicio = obtenerPlanesUsuario;
export const obtenerPlanPorIdServicio = obtenerPlanIntervención;
export const actualizarPlanServicio = async (plan) => {
  if (typeof plan === 'object' && plan !== null) {
    const id = plan.id;
    const payload = { ...plan };
    delete payload.id;
    return actualizarPlan(id, payload);
  }

  return actualizarPlan(plan, {});
};
export const eliminarPlanServicio = eliminarPlan;

export async function agregarObjetivoServicio(planId, objetivo) {
  const plan = await obtenerPlanIntervención(planId);
  const objetivos = asegurarArray(plan?.objetivos);
  const nuevo = {
    id: `obj-${Date.now()}`,
    descripcion: typeof objetivo === 'string' ? objetivo : (objetivo?.descripcion || ''),
    createdAt: new Date().toISOString()
  };

  await actualizarPlan(planId, { objetivos: [...objetivos, nuevo] });
  return nuevo;
}

export async function eliminarObjetivoServicio(planId, objetivoId) {
  const plan = await obtenerPlanIntervención(planId);
  const objetivos = asegurarArray(plan?.objetivos).filter((item) => item.id !== objetivoId);
  return actualizarPlan(planId, { objetivos });
}

export async function agregarActividadServicio(planId, actividad = {}) {
  const plan = await obtenerPlanIntervención(planId);
  const actividades = asegurarArray(plan?.actividades);
  const nueva = {
    id: `act-${Date.now()}`,
    actividad: actividad.actividad || actividad.nombre || 'Actividad',
    duracion: actividad.duracion || `${DURACION_ACTIVIDAD_DEFAULT_MINUTOS} minutos`,
    frecuencia: actividad.frecuencia || '3 veces por semana',
    completado: false
  };

  await actualizarPlan(planId, { actividades: [...actividades, nueva] });
  return nueva;
}

export async function actualizarActividadServicio(planId, actividadId, datosActualizacion = {}) {
  const plan = await obtenerPlanIntervención(planId);
  const actividades = asegurarArray(plan?.actividades).map((item) => {
    if (item.id !== actividadId) return item;
    return { ...item, ...datosActualizacion };
  });

  await actualizarPlan(planId, { actividades });
  return actividades.find((item) => item.id === actividadId);
}

export async function eliminarActividadServicio(planId, actividadId) {
  const plan = await obtenerPlanIntervención(planId);
  const actividades = asegurarArray(plan?.actividades).filter((item) => item.id !== actividadId);
  return actualizarPlan(planId, { actividades });
}

export async function marcarActividadCompletadaServicio(planId, actividadId, completado = true) {
  return actualizarActividadServicio(planId, actividadId, { completado });
}

export async function agregarRegistroSeguimientoServicio(planId, nota = '') {
  const plan = await obtenerPlanIntervención(planId);
  const registroSeguimiento = asegurarArray(plan?.registroSeguimiento);
  const nuevo = {
    id: `reg-${Date.now()}`,
    fecha: new Date().toISOString(),
    nota,
    usuario: auth.currentUser?.email || 'Docente'
  };

  await actualizarPlan(planId, { registroSeguimiento: [...registroSeguimiento, nuevo] });
  return nuevo;
}

export async function obtenerRegistroSeguimientoServicio(planId) {
  const plan = await obtenerPlanIntervención(planId);
  return asegurarArray(plan?.registroSeguimiento);
}

export async function calcularProgresoServicio(planId) {
  const plan = await obtenerPlanIntervención(planId);
  const actividades = asegurarArray(plan?.actividades);
  const completadas = actividades.filter((a) => a.completado || a.estado === 'completada').length;
  const total = actividades.length;
  const porcentaje = total ? Math.round((completadas / total) * 100) : 0;

  return {
    porcentaje,
    actividadesCompletadas: completadas,
    totalActividades: total,
    actividadesPendientes: Math.max(total - completadas, 0)
  };
}

export async function obtenerEstadísticasServicio(planId) {
  const plan = await obtenerPlanIntervención(planId);
  const actividades = asegurarArray(plan?.actividades);
  const objetivos = asegurarArray(plan?.objetivos);
  const registro = asegurarArray(plan?.registroSeguimiento);
  const completadas = actividades.filter((a) => a.completado || a.estado === 'completada').length;

  return {
    totalObjetivos: objetivos.length,
    totalActividades: actividades.length,
    actividadesCompletadas: completadas,
    actividadesPendientes: actividades.length - completadas,
    porcentajeCompleción: actividades.length ? Math.round((completadas / actividades.length) * 100) : 0,
    duracionTotal: actividades.reduce((acc, item) => acc + extraerDuracionMinutos(item.duracion), 0),
    duracionPromedio: actividades.length
      ? Math.round(actividades.reduce((acc, item) => acc + extraerDuracionMinutos(item.duracion), 0) / actividades.length)
      : 0,
    frecuencias: actividades.reduce((acc, item) => {
      const frecuencia = item.frecuencia || 'Sin definir';
      acc[frecuencia] = (acc[frecuencia] || 0) + 1;
      return acc;
    }, {}),
    totalRegistros: registro.length,
    diasActivo: 0
  };
}

export async function buscarPlanesServicio(criterio = '') {
  const planes = await obtenerPlanesUsuario();
  const query = criterio.toLowerCase();
  return planes.filter((plan) => {
    const bolsa = `${plan.nombre || ''} ${plan.nombreEstudiante || ''} ${plan.descripcion || ''}`.toLowerCase();
    return bolsa.includes(query);
  });
}

export async function exportarPlanJSONServicio(planId) {
  const plan = await obtenerPlanIntervención(planId);
  const blob = new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `plan-${planId}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function importarPlanJSONServicio(jsonData) {
  const datos = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
  return guardarPlan(datos);
}

export async function duplicarPlanServicio(planId, nuevoNombre = null) {
  const plan = await obtenerPlanIntervención(planId);
  const copia = {
    ...plan,
    nombre: nuevoNombre || `${plan.nombre || plan.nombrePlan || 'Plan'} (Copia)`,
    nombrePlan: nuevoNombre || `${plan.nombre || plan.nombrePlan || 'Plan'} (Copia)`
  };
  delete copia.id;
  return guardarPlan(copia);
}
