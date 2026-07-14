import {
    crearPeriodo,
    obtenerPeriodos,
    actualizarPeriodo,
    eliminarPeriodo,
    obtenerPeriodo
} from "../../firebase/firestore.js";

import { obtenerConCache, guardarCache } from "../../js/firestore-service.js";

const CACHE_KEY = "cache.periodos";

export async function listarPeriodosServicio(filtros = {}) {
    return obtenerConCache(CACHE_KEY, () => obtenerPeriodos(filtros), 60000);
}

export async function crearPeriodoServicio(datos) {
    const periodo = await crearPeriodo(datos);
    guardarCache(CACHE_KEY, null);
    return periodo;
}

export async function obtenerPeriodoServicio(id) {
    return obtenerPeriodo(id);
}

export async function actualizarPeriodoServicio(id, datos) {
    const periodo = await actualizarPeriodo(id, datos);
    guardarCache(CACHE_KEY, null);
    return periodo;
}

export async function eliminarPeriodoServicio(id) {
    await eliminarPeriodo(id);
    guardarCache(CACHE_KEY, null);
}

export async function validarPeriodoActivo() {
    const periodos = await listarPeriodosServicio({ estado: "activo" });
    if (!periodos.length) {
        throw new Error("No hay período activo. Contacte al administrador.");
    }
    return periodos[0];
}
