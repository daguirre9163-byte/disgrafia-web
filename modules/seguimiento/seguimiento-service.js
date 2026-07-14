import {
    crearRegistroSeguimiento,
    obtenerSeguimientos
} from "../../firebase/firestore.js";

import { obtenerConCache, guardarCache } from "../../js/firestore-service.js";

const CACHE_KEY = "cache.seguimiento";

// Tipos de registros de seguimiento
export const TIPOS_SEGUIMIENTO = {
    evaluacion: "Evaluación",
    actividad: "Actividad",
    observacion: "Observación",
    avance: "Avance",
    retroceso: "Retroceso",
    derivacion: "Derivación",
    plan_intervension: "Plan de Intervención"
};

export async function crearRegistroSeguimientoServicio(datos) {
    if (!datos?.estudianteId) {
        throw new Error("El registro debe incluir un estudiante.");
    }

    if (!datos?.tipo || !TIPOS_SEGUIMIENTO[datos.tipo]) {
        throw new Error("El tipo de seguimiento no es válido.");
    }

    const registro = await crearRegistroSeguimiento({
        ...datos,
        fecha: datos?.fecha || new Date().toISOString()
    });

    // Invalidar cachés
    guardarCache(CACHE_KEY, null);
    guardarCache(`${CACHE_KEY}.estudiante.${datos.estudianteId}`, null);

    return registro;
}

export async function obtenerSeguimientoEstudianteServicio(estudianteId) {
    const cacheKey = `${CACHE_KEY}.estudiante.${estudianteId}`;
    return obtenerConCache(
        cacheKey,
        () => obtenerSeguimientos({ estudianteId }),
        30000
    );
}

export async function obtenerSeguimientoPlanServicio(planId) {
    const cacheKey = `${CACHE_KEY}.plan.${planId}`;
    return obtenerConCache(
        cacheKey,
        () => obtenerSeguimientos({ planId }),
        30000
    );
}

export async function obtenerCronologiaEstudianteServicio(estudianteId) {
    const registros = await obtenerSeguimientoEstudianteServicio(estudianteId);
    
    // Agrupar por tipo de evento
    return {
        evaluaciones: registros.filter(r => r.tipo === "evaluacion"),
        actividades: registros.filter(r => r.tipo === "actividad"),
        observaciones: registros.filter(r => r.tipo === "observacion"),
        avances: registros.filter(r => r.tipo === "avance"),
        retrocesos: registros.filter(r => r.tipo === "retroceso"),
        derivaciones: registros.filter(r => r.tipo === "derivacion"),
        planes: registros.filter(r => r.tipo === "plan_intervension"),
        todos: registros
    };
}

export function analizarTendenciaServicio(seguimientos = []) {
    const avances = seguimientos.filter(s => s.tipo === "avance").length;
    const retrocesos = seguimientos.filter(s => s.tipo === "retroceso").length;
    const total = avances + retrocesos;

    if (total === 0) {
        return {
            tendencia: "sin_datos",
            porcentaje: 0,
            descripcion: "No hay datos de progreso registrados"
        };
    }

    const porcentaje = Math.round((avances / total) * 100);

    return {
        tendencia: porcentaje >= 70 ? "positiva" : porcentaje >= 40 ? "estable" : "negativa",
        porcentaje,
        avances,
        retrocesos,
        descripcion: `${porcentaje}% de progreso positivo (${avances} avances vs ${retrocesos} retrocesos)`
    };
}

export function generarResumenSeguimientoServicio(cronologia) {
    const total = cronologia.todos?.length || 0;
    const tendencia = analizarTendenciaServicio(cronologia.todos);

    return {
        totalRegistros: total,
        porEvaluaciones: cronologia.evaluaciones?.length || 0,
        porActividades: cronologia.actividades?.length || 0,
        porObservaciones: cronologia.observaciones?.length || 0,
        avancesRegistrados: cronologia.avances?.length || 0,
        retrocesosRegistrados: cronologia.retrocesos?.length || 0,
        derivacionesRealizadas: cronologia.derivaciones?.length || 0,
        planesImplementados: cronologia.planes?.length || 0,
        tendencia: tendencia.tendencia,
        porcentajeProgreso: tendencia.porcentaje,
        descripcion: tendencia.descripcion
    };
}

export function generarIndicadoresProgresoServicio(seguimientos = []) {
    if (!seguimientos.length) {
        return {
            indicadores: [],
            mensaje: "No hay datos suficientes para análisis"
        };
    }

    const ultimosRegistros = seguimientos.slice(-10);
    const indicadores = [];

    // Indicador de consistencia
    const evaluacionesConsecutivas = seguimientos
        .filter(s => s.tipo === "evaluacion")
        .map((s, i, arr) => {
            if (i === 0) return 0;
            const anterior = arr[i - 1];
            const diferencia = (s.calificacion || 0) - (anterior.calificacion || 0);
            return diferencia;
        })
        .filter(d => d !== 0);

    if (evaluacionesConsecutivas.length > 0) {
        const promedioCambio = evaluacionesConsecutivas.reduce((a, b) => a + b) / evaluacionesConsecutivas.length;
        indicadores.push({
            nombre: "Cambio Promedio en Evaluaciones",
            valor: promedioCambio.toFixed(2),
            signo: promedioCambio > 0 ? "+" : "-",
            tipo: promedioCambio > 0 ? "positivo" : "negativo"
        });
    }

    // Indicador de frecuencia de actividades
    const actividadesUltimo = ultimosRegistros.filter(s => s.tipo === "actividad").length;
    indicadores.push({
        nombre: "Actividades Últimos Registros",
        valor: actividadesUltimo,
        tipo: actividadesUltimo >= 5 ? "positivo" : "neutral"
    });

    // Indicador de observaciones
    const observacionesUltimo = ultimosRegistros.filter(s => s.tipo === "observacion").length;
    indicadores.push({
        nombre: "Observaciones Recientes",
        valor: observacionesUltimo,
        tipo: observacionesUltimo > 0 ? "positivo" : "neutral"
    });

    return { indicadores, detalle: ultimosRegistros };
}

export function generarObservacionesAcumuladasServicio(seguimientos = []) {
    const observaciones = seguimientos
        .filter(s => s.tipo === "observacion" && s.descripcion)
        .map(s => ({
            fecha: s.fecha,
            contenido: s.descripcion,
            autor: s.docenteId
        }))
        .reverse();

    return {
        total: observaciones.length,
        observaciones,
        temas: extraerTemasObservacionesServicio(observaciones)
    };
}

function extraerTemasObservacionesServicio(observaciones = []) {
    const temasComunes = {};
    const palabrasClave = [
        "motricidad", "coordinación", "espaciamiento", "presión", "velocidad",
        "legibilidad", "concentración", "fatiga", "postura", "confianza",
        "mejora", "dificultad", "requiere refuerzo"
    ];

    observaciones.forEach(obs => {
        const contenido = obs.contenido.toLowerCase();
        palabrasClave.forEach(palabra => {
            if (contenido.includes(palabra)) {
                temasComunes[palabra] = (temasComunes[palabra] || 0) + 1;
            }
        });
    });

    return Object.entries(temasComunes)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tema, frecuencia]) => ({ tema, frecuencia }));
}

export function calcularVelocidadMejoraServicio(seguimientos = []) {
    const evaluaciones = seguimientos
        .filter(s => s.tipo === "evaluacion" && s.calificacion)
        .map(s => ({
            fecha: new Date(s.fecha),
            calificacion: Number(s.calificacion)
        }))
        .sort((a, b) => a.fecha - b.fecha);

    if (evaluaciones.length < 2) {
        return {
            velocidadMejora: 0,
            tendencia: "insuficientes_datos",
            mensaje: "Se requieren al menos 2 evaluaciones"
        };
    }

    const primera = evaluaciones[0];
    const ultima = evaluaciones[evaluaciones.length - 1];
    const diferencia = ultima.calificacion - primera.calificacion;
    const diasTranscurridos = (ultima.fecha - primera.fecha) / (1000 * 60 * 60 * 24);
    const velocidadPorDia = diasTranscurridos > 0 ? diferencia / diasTranscurridos : 0;

    return {
        velocidadMejora: velocidadPorDia.toFixed(3),
        diferenciaTotalPuntos: diferencia.toFixed(2),
        diasTranscurridos: Math.round(diasTranscurridos),
        tendencia: diferencia > 0 ? "positiva" : diferencia < 0 ? "negativa" : "estable",
        mensaje: `Mejora de ${diferencia > 0 ? "+" : ""}${diferencia.toFixed(2)} puntos en ${Math.round(diasTranscurridos)} días`
    };
}

export function generarHistorialCompletoServicio(seguimientos = []) {
    const historial = {
        totales: {
            registros: seguimientos.length,
            periodoInicio: seguimientos.length > 0 ? seguimientos[0].fecha : null,
            periodoFin: seguimientos.length > 0 ? seguimientos[seguimientos.length - 1].fecha : null
        },
        porTipo: {},
        cronologia: seguimientos.reverse(),
        tendencia: analizarTendenciaServicio(seguimientos),
        indicadores: generarIndicadoresProgresoServicio(seguimientos),
        observaciones: generarObservacionesAcumuladasServicio(seguimientos),
        velocidadMejora: calcularVelocidadMejoraServicio(seguimientos)
    };

    // Contar por tipo
    Object.keys(TIPOS_SEGUIMIENTO).forEach(tipo => {
        historial.porTipo[tipo] = seguimientos.filter(s => s.tipo === tipo).length;
    });

    return historial;
}

export function exportarHistorialServicio(historial, formato = "json") {
    if (formato === "json") {
        return JSON.stringify(historial, null, 2);
    }

    if (formato === "csv") {
        const headers = ["Fecha", "Tipo", "Descripción", "Docente"];
        const rows = historial.cronologia.map(s => [
            new Date(s.fecha).toLocaleDateString("es-EC"),
            TIPOS_SEGUIMIENTO[s.tipo] || s.tipo,
            s.descripcion || "",
            s.docenteId || ""
        ]);

        return [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(","))
            .join("\n");
    }

    return null;
}
