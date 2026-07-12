//=====================================================
// SIGEDIS
// FIRESTORE
//=====================================================

import { db, auth } from './firebase-config.js';
import { COLLECTIONS } from './collections.js';

import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';

function obtenerUsuarioActual() {
  const usuario = auth.currentUser;
  if (!usuario) {
    throw new Error('No existe una sesión activa.');
  }
  return usuario;
}

function claveCache(coleccion) {
  return `sigedis.cache.${coleccion}`;
}

function guardarCache(coleccion, datos) {
  localStorage.setItem(claveCache(coleccion), JSON.stringify(datos));
}

function leerCache(coleccion) {
  const raw = localStorage.getItem(claveCache(coleccion));
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function crearDocumento(coleccion, datos) {
  const usuario = obtenerUsuarioActual();
  return addDoc(collection(db, coleccion), {
    ...datos,
    docenteId: usuario.uid,
    fechaCreacion: serverTimestamp()
  });
}

async function listarPorDocente(coleccion) {
  const usuario = auth.currentUser;
  if (!usuario) return [];

  try {
    const consulta = query(
      collection(db, coleccion),
      where('docenteId', '==', usuario.uid),
      orderBy('fechaCreacion', 'desc')
    );
    const snapshot = await getDocs(consulta);
    const registros = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
    guardarCache(coleccion, registros);
    return registros;
  } catch (error) {
    console.warn(`Usando caché local de ${coleccion}:`, error.message);
    return leerCache(coleccion);
  }
}

async function obtenerDocumento(coleccion, id) {
  const documento = await getDoc(doc(db, coleccion, id));
  if (!documento.exists()) return null;
  return { id: documento.id, ...documento.data() };
}

async function actualizarDocumento(coleccion, id, datos) {
  return updateDoc(doc(db, coleccion, id), datos);
}

async function eliminarDocumento(coleccion, id) {
  return deleteDoc(doc(db, coleccion, id));
}

//=====================================================
// CURSOS
//=====================================================

export async function crearCurso(datos) {
  return crearDocumento(COLLECTIONS.CURSOS, {
    ...datos,
    estado: 'activo',
    totalEstudiantes: 0,
    totalGuias: 0,
    totalEvaluaciones: 0
  });
}

export async function listarCursos() {
  return listarPorDocente(COLLECTIONS.CURSOS);
}

export async function obtenerCurso(id) {
  return obtenerDocumento(COLLECTIONS.CURSOS, id);
}

export async function actualizarCurso(id, datos) {
  return actualizarDocumento(COLLECTIONS.CURSOS, id, datos);
}

export async function eliminarCurso(id) {
  return eliminarDocumento(COLLECTIONS.CURSOS, id);
}

//=====================================================
// ESTUDIANTES
//=====================================================

export async function crearEstudiante(datos) {
  return crearDocumento(COLLECTIONS.ESTUDIANTES, datos);
}

export async function listarEstudiantes() {
  return listarPorDocente(COLLECTIONS.ESTUDIANTES);
}

export async function obtenerEstudiante(id) {
  return obtenerDocumento(COLLECTIONS.ESTUDIANTES, id);
}

export async function actualizarEstudiante(id, datos) {
  return actualizarDocumento(COLLECTIONS.ESTUDIANTES, id, datos);
}

export async function eliminarEstudiante(id) {
  return eliminarDocumento(COLLECTIONS.ESTUDIANTES, id);
}

//=====================================================
// GUÍAS
//=====================================================

export async function crearGuia(datos) {
  return crearDocumento(COLLECTIONS.GUIAS, datos);
}

export async function listarGuias() {
  return listarPorDocente(COLLECTIONS.GUIAS);
}

export async function obtenerGuia(id) {
  return obtenerDocumento(COLLECTIONS.GUIAS, id);
}

export async function actualizarGuia(id, datos) {
  return actualizarDocumento(COLLECTIONS.GUIAS, id, datos);
}

export async function eliminarGuia(id) {
  return eliminarDocumento(COLLECTIONS.GUIAS, id);
}

//=====================================================
// EVALUACIONES
//=====================================================

export async function crearEvaluacion(datos) {
  return crearDocumento(COLLECTIONS.EVALUACIONES, datos);
}

export async function listarEvaluaciones() {
  return listarPorDocente(COLLECTIONS.EVALUACIONES);
}

//=====================================================
// PROGRESO / SEGUIMIENTO
//=====================================================

export async function crearProgreso(datos) {
  return crearDocumento(COLLECTIONS.PROGRESO, datos);
}

export async function listarProgreso() {
  return listarPorDocente(COLLECTIONS.PROGRESO);
}
