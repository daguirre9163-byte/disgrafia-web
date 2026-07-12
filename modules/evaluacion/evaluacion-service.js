import {
    crearEvaluacion,
    obtenerEvaluaciones,
    actualizarEvaluacion
} from "../../firebase/firestore.js";

import { obtenerConCache, guardarCache } from "../../js/firestore-service.js";

const CACHE_KEY = "cache.evaluaciones";

export async function obtenerEvaluacionesServicio(filtros = {}) {
    return obtenerConCache(CACHE_KEY, () => obtenerEvaluaciones(filtros), 30000);
}

export async function crearEvaluacionServicio(datos) {
    const evaluacion = await crearEvaluacion(datos);
    guardarCache(CACHE_KEY, null);
    return evaluacion;
}

export async function actualizarEvaluacionServicio(id, datos) {
    const evaluacion = await actualizarEvaluacion(id, datos);
    guardarCache(CACHE_KEY, null);
    return evaluacion;
}

export function calcularPromedioEvaluaciones(evaluaciones = []) {
    if (!evaluaciones.length) {
        return 0;
    }

    const total = evaluaciones.reduce((acumulado, evaluacion) => {
        return acumulado + Number(evaluacion.calificacion || 0);
    }, 0);

    return Number((total / evaluaciones.length).toFixed(2));
}
