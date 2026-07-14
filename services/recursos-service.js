import { auth, db } from '../firebase/firebase-config.js';
import {
  crearRecurso,
  obtenerRecursos as obtenerRecursosFirestore,
  actualizarRecurso
} from '../firebase/firestore.js';
import {
  addDoc,
  collection,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';

const FUENTE_LOCAL = '/data/recursos.json';

function normalizarRecurso(recurso = {}) {
  const downloadCount = Number(recurso.downloadCount ?? recurso.descargado ?? 0);
  return {
    id: recurso.id,
    titulo: recurso.titulo || recurso.nombre || 'Recurso sin título',
    descripcion: recurso.descripcion || '',
    tipo: recurso.tipo || 'Teoría',
    categoria: recurso.categoria || 'General',
    url: recurso.url || '#',
    autor: recurso.autor || 'Sistema SIGEDIS',
    downloadCount,
    descargado: downloadCount
  };
}

async function cargarRecursosLocales() {
  const response = await fetch(FUENTE_LOCAL);
  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return (data.recursos || []).map(normalizarRecurso);
}

export async function obtenerRecursos() {
  try {
    const recursos = await obtenerRecursosFirestore();
    if (Array.isArray(recursos) && recursos.length) {
      return recursos.map(normalizarRecurso);
    }
  } catch (error) {
    console.warn('No se pudieron cargar recursos desde Firestore. Se usa dataset local.', error);
  }

  return cargarRecursosLocales();
}

export async function buscarRecursos(termino = '') {
  const recursos = await obtenerRecursos();
  const texto = termino.trim().toLowerCase();

  if (!texto) {
    return recursos;
  }

  return recursos.filter((recurso) => {
    const bolsa = `${recurso.titulo} ${recurso.descripcion} ${recurso.categoria} ${recurso.autor}`.toLowerCase();
    return bolsa.includes(texto);
  });
}

export async function filtrarRecursos(tipo = '') {
  const recursos = await obtenerRecursos();
  if (!tipo) {
    return recursos;
  }

  const tipoBuscado = tipo.toLowerCase();
  return recursos.filter((recurso) => recurso.tipo.toLowerCase() === tipoBuscado);
}

export async function guardarRecursoVisitado(recurso = {}) {
  const usuarioId = auth.currentUser?.uid || 'usuario-anonimo';

  try {
    await addDoc(collection(db, 'recursosConsultados'), {
      recursoId: String(recurso.id || ''),
      titulo: recurso.titulo || 'Sin título',
      tipo: recurso.tipo || 'Desconocido',
      categoria: recurso.categoria || 'General',
      usuarioId,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.warn('No fue posible registrar consulta en Firestore.', error);
  }

  if (recurso?.id && typeof recurso.id === 'string') {
    try {
      await actualizarRecurso(recurso.id, {
        downloadCount: Number(recurso.downloadCount ?? recurso.descargado ?? 0) + 1,
        descargado: Number(recurso.downloadCount ?? recurso.descargado ?? 0) + 1
      });
    } catch (error) {
      console.warn('No fue posible actualizar contador de descargas.', error);
    }
  }
}

export async function obtenerRecursosPorCategoria() {
  const recursos = await obtenerRecursos();

  return recursos.reduce((acc, recurso) => {
    const categoria = recurso.categoria || 'General';
    if (!acc[categoria]) {
      acc[categoria] = [];
    }
    acc[categoria].push(recurso);
    return acc;
  }, {});
}

export async function crearRecursoEducativo(datos = {}) {
  return crearRecurso({
    ...datos,
    titulo: datos.titulo || 'Recurso sin título'
  });
}
