import { crearActividad, obtenerActividades } from "../../firebase/firestore.js";

export async function obtenerActividadesServicio() {
  return obtenerActividades();
}

export async function crearActividadServicio(datos) {
  return crearActividad({ ...datos, progreso: Number(datos.progreso || 0), completada: Boolean(datos.completada) });
}
