import {
    crearParalelo,
    obtenerParalelos,
    actualizarParalelo,
    eliminarParalelo,
    obtenerParalelo,
    obtenerParalelosPorCurso
} from "../../firebase/firestore.js";

import {
    validarEliminacionParalelo,
    validarIntegridad
} from "../../firebase/validaciones-integridad.js";

import { obtenerConCache, guardarCache } from "../../js/firestore-service.js";

const CACHE_KEY = "cache.paralelos";

export async function listarParalelosServicio(filtros = {}) {
    const cacheKey = filtros.cursoId ? `${CACHE_KEY}.curso.${filtros.cursoId}` : CACHE_KEY;
    return obtenerConCache(cacheKey, () => obtenerParalelos(filtros), 30000);
}

export async function crearParaleloServicio(datos) {
    const paralelo = await crearParalelo(datos);
    guardarCache(CACHE_KEY, null);
    if (datos.cursoId) {
        guardarCache(`${CACHE_KEY}.curso.${datos.cursoId}`, null);
    }
    return paralelo;
}

export async function actualizarParaleloServicio(id, datos) {
    const paraleloActual = await obtenerParalelo(id);
    const paralelo = await actualizarParalelo(id, datos);
    guardarCache(CACHE_KEY, null);
    if (paraleloActual?.cursoId) {
        guardarCache(`${CACHE_KEY}.curso.${paraleloActual.cursoId}`, null);
    }
    if (datos.cursoId) {
        guardarCache(`${CACHE_KEY}.curso.${datos.cursoId}`, null);
    }
    return paralelo;
}

export async function eliminarParaleloServicio(id) {
    const paraleloActual = await obtenerParalelo(id);
    await eliminarParalelo(id);
    guardarCache(CACHE_KEY, null);
    if (paraleloActual?.cursoId) {
        guardarCache(`${CACHE_KEY}.curso.${paraleloActual.cursoId}`, null);
    }
}

export async function obtenerParaleloServicio(id) {
    return obtenerParalelo(id);
}

export async function obtenerParalelosCursoServicio(cursoId) {
    return obtenerParalelosPorCurso(cursoId);
}

export async function validarEliminacionParaleloServicio(paraleloId) {
    return validarEliminacionParalelo(paraleloId);
}

export async function validarIntegridadParaleloServicio(cursoId, paraleloId) {
    return validarIntegridad(cursoId, paraleloId);
}
