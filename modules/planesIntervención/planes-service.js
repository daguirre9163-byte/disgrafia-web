import {
    crearPlanIntervención,
    obtenerPlanesIntervención,
    obtenerPlanIntervención,
    actualizarPlanIntervención,
    agregarActividadAlPlan,
    eliminarPlanIntervención
} from "../../firebase/firestore.js";

import { obtenerConCache, guardarCache } from "../../js/firestore-service.js";

const CACHE_KEY = "cache.planes";

export async function crearPlanIntervencionServicio(datos) {
    if (!datos?.estudianteId) {
        throw new Error("El plan debe incluir un estudiante.");
    }

    if (!datos?.nombre) {
        throw new Error("El plan debe tener un nombre.");
    }

    if (!datos?.objetivo) {
        throw new Error("El plan debe tener un objetivo.");
    }

    const plan = await crearPlanIntervención({
        ...datos,
        actividades: datos?.actividades || [],
        estado: "activo",
        duracionSemanas: datos?.duracionSemanas || 4
    });

    guardarCache(CACHE_KEY, null);
    if (datos?.estudianteId) {
        guardarCache(`${CACHE_KEY}.estudiante.${datos.estudianteId}`, null);
    }

    return plan;
}

export async function obtenerPlanesEstudianteServicio(estudianteId) {
    const cacheKey = `${CACHE_KEY}.estudiante.${estudianteId}`;
    return obtenerConCache(
        cacheKey,
        () => obtenerPlanesIntervención({ estudianteId }),
        45000
    );
}

export async function obtenerPlanesActivosServicio(filtros = {}) {
    return obtenerConCache(
        `${CACHE_KEY}.activos`,
        () => obtenerPlanesIntervención({ ...filtros, estado: "activo" }),
        30000
    );
}

export async function obtenerPlanServicio(id) {
    return obtenerPlanIntervención(id);
}

export async function actualizarPlanServicio(id, datos) {
    const plan = await obtenerPlanIntervención(id);
    if (!plan) {
        throw new Error("El plan no existe.");
    }

    const actualizado = await actualizarPlanIntervención(id, datos);

    guardarCache(CACHE_KEY, null);
    guardarCache(`${CACHE_KEY}.activos`, null);
    if (plan?.estudianteId) {
        guardarCache(`${CACHE_KEY}.estudiante.${plan.estudianteId}`, null);
    }

    return actualizado;
}

export async function agregarActividadAlPlanServicio(planId, actividad) {
    const plan = await obtenerPlanIntervención(planId);
    if (!plan) {
        throw new Error("El plan no existe.");
    }

    if (!actividad?.actividadId) {
        throw new Error("La actividad debe incluir un ID válido.");
    }

    const resultado = await agregarActividadAlPlan(planId, {
        ...actividad,
        estado: "pendiente",
        orden: (plan.actividades?.length || 0) + 1
    });

    guardarCache(CACHE_KEY, null);
    if (plan?.estudianteId) {
        guardarCache(`${CACHE_KEY}.estudiante.${plan.estudianteId}`, null);
    }

    return resultado;
}

export async function marcarActividadCompletadaServicio(planId, orden) {
    const plan = await obtenerPlanIntervención(planId);
    if (!plan) {
        throw new Error("El plan no existe.");
    }

    const actividades = (plan.actividades || []).map(act => 
        act.orden === orden ? { ...act, estado: "completada" } : act
    );

    const resultado = await actualizarPlanServicio(planId, { actividades });

    // Verificar si todas están completadas
    const todasCompletadas = actividades.every(act => act.estado === "completada");
    if (todasCompletadas) {
        await actualizarPlanServicio(planId, { estado: "completado" });
    }

    return resultado;
}

export async function pausarPlanServicio(planId, razon = "") {
    const plan = await obtenerPlanIntervención(planId);
    if (!plan) {
        throw new Error("El plan no existe.");
    }

    return actualizarPlanServicio(planId, {
        estado: "pausado",
        razonPausa: razon,
        fechaPausa: new Date().toISOString()
    });
}

export async function reanudarPlanServicio(planId) {
    const plan = await obtenerPlanIntervención(planId);
    if (!plan) {
        throw new Error("El plan no existe.");
    }

    return actualizarPlanServicio(planId, {
        estado: "activo",
        razonPausa: null,
        fechaPausa: null
    });
}

export async function eliminarPlanServicio(planId) {
    const plan = await obtenerPlanIntervención(planId);
    if (!plan) {
        throw new Error("El plan no existe.");
    }

    await eliminarPlanIntervención(planId);

    guardarCache(CACHE_KEY, null);
    guardarCache(`${CACHE_KEY}.activos`, null);
    if (plan?.estudianteId) {
        guardarCache(`${CACHE_KEY}.estudiante.${plan.estudianteId}`, null);
    }
}

export function calcularProgresoPlan(plan = {}) {
    const actividades = plan.actividades || [];
    if (!actividades.length) return 0;

    const completadas = actividades.filter(a => a.estado === "completada").length;
    return Math.round((completadas / actividades.length) * 100);
}

export function obtenerEstadoPlan(plan = {}) {
    const progreso = calcularProgresoPlan(plan);
    const estado = plan.estado || "activo";

    return {
        estado,
        progreso,
        totalActividades: plan.actividades?.length || 0,
        completadas: plan.actividades?.filter(a => a.estado === "completada").length || 0,
        pendientes: plan.actividades?.filter(a => a.estado === "pendiente").length || 0,
        enProgreso: plan.actividades?.filter(a => a.estado === "en_progreso").length || 0
    };
}

export function generarResumenPlan(plan = {}) {
    const estado = obtenerEstadoPlan(plan);
    const duracion = plan.duracionSemanas || 4;
    const semanasTranscurridas = plan.fechaInicio 
        ? Math.floor((Date.now() - new Date(plan.fechaInicio).getTime()) / (7 * 24 * 60 * 60 * 1000))
        : 0;

    return {
        nombre: plan.nombre,
        objetivo: plan.objetivo,
        duracionSemanas: duracion,
        semanasTranscurridas,
        estado: estado.estado,
        progreso: estado.progreso,
        actividades: {
            total: estado.totalActividades,
            completadas: estado.completadas,
            pendientes: estado.pendientes,
            enProgreso: estado.enProgreso
        },
        onTime: semanasTranscurridas <= duracion,
        proximo: plan.actividades?.find(a => a.estado === "pendiente")
    };
}
