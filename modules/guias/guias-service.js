import { db, auth } from '../../firebase/firebase-config.js';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';

const COLECCION = 'guias_metodologicas';

export async function obtenerGuiasServicio() {
  try {
    const snapshot = await getDocs(collection(db, COLECCION));
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error al obtener guías:', error);
    return [];
  }
}

export async function crearGuiaServicio(datos) {
  try {
    const usuario = auth.currentUser;
    if (!usuario) throw new Error('Usuario no autenticado');

    const docRef = await addDoc(collection(db, COLECCION), {
      ...datos,
      creadoPor: usuario.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return docRef.id;
  } catch (error) {
    console.error('Error al crear guía:', error);
    throw error;
  }
}

export async function actualizarGuiaServicio(id, datos) {
  try {
    const docRef = doc(db, COLECCION, id);
    await updateDoc(docRef, {
      ...datos,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error al actualizar guía:', error);
    throw error;
  }
}

export async function eliminarGuiaServicio(id) {
  try {
    await deleteDoc(doc(db, COLECCION, id));
  } catch (error) {
    console.error('Error al eliminar guía:', error);
    throw error;
  }
}