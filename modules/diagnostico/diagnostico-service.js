import {
    crearDiagnostico,
    obtenerDiagnosticos,
    obtenerDiagnostico,
    actualizarDiagnostico,
    eliminarDiagnostico
} from "../../firebase/firestore.js";

import { obtenerConCache, guardarCache } from "../../js/firestore-service.js";

const CACHE_KEY = "cache.diagnosticos";

export async function crearDiagnosticoServicio(datos) {
    if (!datos?.estudianteId) {
        throw new Error("El diagnóstico debe incluir un estudiante.");
    }

    if (!datos?.tipo) {
        throw new Error("Debe seleccionar un tipo de disgrafía.");
    }

    const diagnostico = await crearDiagnostico(datos);
    
    // Invalidar cachés relacionados
    guardarCache(CACHE_KEY, null);
    if (datos?.estudianteId) {
        guardarCache(`${CACHE_KEY}.estudiante.${datos.estudianteId}`, null);
    }
    
    return diagnostico;
}

export async function obtenerDiagnosticosEstudianteServicio(estudianteId) {
    const cacheKey = `${CACHE_KEY}.estudiante.${estudianteId}`;
    return obtenerConCache(
        cacheKey,
        () => obtenerDiagnosticos({ estudianteId }),
        45000
    );
}

export async function obtenerDiagnosticosServicio(filtros = {}) {
    return obtenerConCache(CACHE_KEY, () => obtenerDiagnosticos(filtros), 60000);
}

export async function obtenerDiagnosticoServicio(id) {
    return obtenerDiagnostico(id);
}

export async function actualizarDiagnosticoServicio(id, datos) {
    const diagnostico = await obtenerDiagnostico(id);
    if (!diagnostico) {
        throw new Error("El diagnóstico no existe.");
    }

    const actualizado = await actualizarDiagnostico(id, datos);
    
    // Invalidar cachés
    guardarCache(CACHE_KEY, null);
    if (diagnostico?.estudianteId) {
        guardarCache(`${CACHE_KEY}.estudiante.${diagnostico.estudianteId}`, null);
    }
    
    return actualizado;
}

export async function eliminarDiagnosticoServicio(id) {
    const diagnostico = await obtenerDiagnostico(id);
    if (!diagnostico) {
        throw new Error("El diagnóstico no existe.");
    }

    await eliminarDiagnostico(id);
    
    // Invalidar cachés
    guardarCache(CACHE_KEY, null);
    if (diagnostico?.estudianteId) {
        guardarCache(`${CACHE_KEY}.estudiante.${diagnostico.estudianteId}`, null);
    }
}

// Tipos de disgrafía con descripción
export const TIPOS_DISGRAFIA = {
    motriz: {
        nombre: "Disgrafía Motriz",
        descripcion: "Dificultad en la coordinación motora fina. Afecta la presión, velocidad y tamaño de la letra.",
        caracteristicas: [
            "Mala coordinación motora",
            "Presión irregular del lápiz",
            "Escritura lenta y fatigosa",
            "Letras de tamaño inconsistente"
        ],
        indicadores: [
            "Dificultad para sostener el lápiz",
            "Fatiga rápida en la mano",
            "Movimientos imprecisos",
            "Escritura con presión excesiva o insuficiente"
        ]
    },
    espacial: {
        nombre: "Disgrafía Espacial",
        descripcion: "Dificultad para organizar el espacio en la página. Problemas con márgenes, espaciamiento entre letras y renglones.",
        caracteristicas: [
            "Desorganización del espacio",
            "Espaciamiento inconsistente",
            "Márgenes descuidados",
            "Líneas desiguales"
        ],
        indicadores: [
            "Escritura fuera de márgenes",
            "Distancia irregular entre letras",
            "Falta de alineación",
            "Renglones desiguales"
        ]
    },
    dislexica: {
        nombre: "Disgrafía Disléxica",
        descripcion: "Dificultad en la conversión de sonidos a símbolos escritos. Incluye inversiones, rotaciones y omisiones.",
        caracteristicas: [
            "Inversión de letras",
            "Rotaciones de números",
            "Omisión de letras",
            "Confusión de letras similares"
        ],
        indicadores: [
            "Escritura de letras invertidas",
            "Confusión b/d, p/q",
            "Omisión de letras en palabras",
            "Sustitución de letras"
        ]
    },
    fonologica: {
        nombre: "Disgrafía Fonológica",
        descripcion: "Dificultad en la conversión fonema-grafema. Problemas con la segmentación fonética.",
        caracteristicas: [
            "Errores en la conversión fonema-grafema",
            "Omisión de sílabas",
            "Adición de letras innecesarias",
            "Separación incorrecta de palabras"
        ],
        indicadores: [
            "Escritura de palabras incompletas",
            "Adición de letras al final de palabras",
            "Unión de palabras",
            "Segmentación incorrecta de oraciones"
        ]
    },
    evolutiva: {
        nombre: "Disgrafía Evolutiva",
        descripcion: "Retraso en el desarrollo normal de la escritura. Es la forma más común en niños.",
        caracteristicas: [
            "Retraso en aprendizaje de escritura",
            "Incompetencia grafo-motriz",
            "Falta de madurez motora",
            "Integración deficiente de habilidades"
        ],
        indicadores: [
            "Edad inferior al esperado en desarrollo",
            "Inmadurez motora general",
            "Dificultad coordinativa",
            "Lentitud en el aprendizaje"
        ]
    },
    adquirida: {
        nombre: "Disgrafía Adquirida",
        descripcion: "Pérdida o deterioro de la habilidad de escritura por lesión cerebral o enfermedad.",
        caracteristicas: [
            "Afasia",
            "Alexia",
            "Dispraxia",
            "Apraxia"
        ],
        indicadores: [
            "Cambio reciente en escritura",
            "Pérdida de habilidades previas",
            "Incoherencia en la escritura",
            "Deterioro progresivo"
        ]
    }
};

export function obtenerInfoTipoDisgrafia(tipo) {
    return TIPOS_DISGRAFIA[tipo] || null;
}

export function calcularNivelRiesgo(indicadoresObservados = []) {
    if (!indicadoresObservados.length) return "bajo";
    
    const cantidad = indicadoresObservados.length;
    if (cantidad <= 2) return "bajo";
    if (cantidad <= 4) return "medio";
    return "alto";
}

export function generarRecomendacionesInicialesServicio(diagnostico) {
    const recomendaciones = [];
    const info = obtenerInfoTipoDisgrafia(diagnostico?.tipo);

    if (!info) return recomendaciones;

    recomendaciones.push({
        tipo: "observacion",
        titulo: "Observación Inicial",
        contenido: `Se ha identificado posible ${info.nombre}. Esta herramienta orienta al docente y NO REEMPLAZA la evaluación de un profesional especializado.`
    });

    if (diagnostico?.requiereDerivacion) {
        recomendaciones.push({
            tipo: "alerta",
            titulo: "Derivación Recomendada",
            contenido: `Se recomienda derivar al estudiante a: Psicólogo, Psicopedagogo o Terapeuta Ocupacional para evaluación profesional.`
        });
    }

    recomendaciones.push({
        tipo: "estrategia",
        titulo: "Estrategias Pedagógicas",
        contenido: "Utilizar metodologías multisensoriales, actividades de motricidad fina, ejercicios de coordinación visual-motora."
    });

    recomendaciones.push({
        tipo: "recursos",
        titulo: "Recursos Recomendados",
        contenido: "Consulte la biblioteca de recursos para actividades específicas según el tipo de disgrafía identificado."
    });

    return recomendaciones;
}
