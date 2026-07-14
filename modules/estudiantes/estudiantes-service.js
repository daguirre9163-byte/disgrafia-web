import {
    crearEstudiante,
    obtenerEstudiantes,
    actualizarEstudiante,
    eliminarEstudiante
} from "../../firebase/firestore.js";

import {
    validarIntegridad,
    validarEliminacionCurso
} from "../../firebase/validaciones-integridad.js";

import { subirFotoEstudiante } from "../../firebase/storage.js";
import { obtenerConCache, guardarCache } from "../../js/firestore-service.js";

const CACHE_KEY = "cache.estudiantes";

export async function obtenerEstudiantesServicio(filtros = {}) {
    return obtenerConCache(CACHE_KEY, () => obtenerEstudiantes(filtros), 30000);
}

export async function crearEstudianteServicio(datos) {
    const estudiante = await crearEstudiante(datos);
    guardarCache(CACHE_KEY, null);
    return estudiante;
}

export async function actualizarEstudianteServicio(id, datos) {
    const estudiante = await actualizarEstudiante(id, datos);
    guardarCache(CACHE_KEY, null);
    return estudiante;
}

export async function eliminarEstudianteServicio(id) {
    await eliminarEstudiante(id);
    guardarCache(CACHE_KEY, null);
}

export async function subirFotoEstudianteServicio(estudianteId, archivo) {
    return subirFotoEstudiante(estudianteId, archivo);
}

export async function validarEstudianteCursoParaleloServicio(cursoId, paraleloId) {
    return validarIntegridad(cursoId, paraleloId);
}

export async function validarDisponibilidadCursosServicio(cursoId) {
    return validarEliminacionCurso(cursoId);
}
