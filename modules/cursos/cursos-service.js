import {
    crearCurso,
    obtenerCursos,
    actualizarCurso,
    obtenerCurso,
    eliminarCurso
} from "../../firebase/firestore.js";

import { obtenerConCache, guardarCache } from "../../js/firestore-service.js";

const CACHE_KEY = "cache.cursos";

export async function listarCursosServicio() {
    return obtenerConCache(CACHE_KEY, () => obtenerCursos(), 30000);
}

export async function crearCursoServicio(datos) {
    const curso = await crearCurso(datos);
    guardarCache(CACHE_KEY, null);
    return curso;
}

export async function actualizarCursoServicio(id, datos) {
    const curso = await actualizarCurso(id, datos);
    guardarCache(CACHE_KEY, null);
    return curso;
}

export async function obtenerCursoServicio(id) {
    return obtenerCurso(id);
}

export async function eliminarCursoServicio(id) {
    await eliminarCurso(id);
    guardarCache(CACHE_KEY, null);
}
