import {
    obtenerCurso,
    obtenerParalelo,
    obtenerParalelosPorCurso,
    obtenerEstudiantes
} from "./firestore.js";

export async function validarEliminacionCurso(cursoId) {
    const [curso, paralelos] = await Promise.all([
        obtenerCurso(cursoId),
        obtenerParalelosPorCurso(cursoId)
    ]);

    if (!curso) {
        return {
            valido: false,
            mensaje: "El curso seleccionado no existe.",
            curso: null,
            totalParalelos: 0,
            totalEstudiantes: 0
        };
    }

    if (paralelos.length) {
        return {
            valido: false,
            mensaje: `No se puede eliminar el curso porque tiene ${paralelos.length} paralelo(s) asociado(s).`,
            curso,
            totalParalelos: paralelos.length,
            totalEstudiantes: 0
        };
    }

    const estudiantes = await obtenerEstudiantes({ cursoId });

    if (estudiantes.length) {
        return {
            valido: false,
            mensaje: `No se puede eliminar el curso porque tiene ${estudiantes.length} estudiante(s) asociado(s).`,
            curso,
            totalParalelos: 0,
            totalEstudiantes: estudiantes.length
        };
    }

    return {
        valido: true,
        mensaje: "",
        curso,
        totalParalelos: 0,
        totalEstudiantes: 0
    };
}

export async function validarEliminacionParalelo(paraleloId) {
    const [paralelo, estudiantes] = await Promise.all([
        obtenerParalelo(paraleloId),
        obtenerEstudiantes({ paraleloId })
    ]);

    if (!paralelo) {
        return {
            valido: false,
            mensaje: "El paralelo seleccionado no existe.",
            paralelo: null,
            totalEstudiantes: 0
        };
    }

    if (estudiantes.length) {
        return {
            valido: false,
            mensaje: `No se puede eliminar el paralelo porque tiene ${estudiantes.length} estudiante(s) asociado(s).`,
            paralelo,
            totalEstudiantes: estudiantes.length
        };
    }

    return {
        valido: true,
        mensaje: "",
        paralelo,
        totalEstudiantes: 0
    };
}

export async function validarIntegridad(cursoId, paraleloId) {
    if (!cursoId) {
        return {
            valido: false,
            mensaje: "Debe seleccionar un curso válido.",
            curso: null,
            paralelo: null
        };
    }

    if (!paraleloId) {
        return {
            valido: false,
            mensaje: "Debe seleccionar un paralelo válido.",
            curso: null,
            paralelo: null
        };
    }

    const [curso, paralelo] = await Promise.all([
        obtenerCurso(cursoId),
        obtenerParalelo(paraleloId)
    ]);

    if (!curso) {
        return {
            valido: false,
            mensaje: "El curso seleccionado no existe.",
            curso: null,
            paralelo: null
        };
    }

    if (!paralelo) {
        return {
            valido: false,
            mensaje: "El paralelo seleccionado no existe.",
            curso,
            paralelo: null
        };
    }

    if (paralelo.cursoId !== cursoId) {
        return {
            valido: false,
            mensaje: `El paralelo seleccionado pertenece al curso '${paralelo.cursoId}', no al curso '${cursoId}' indicado.`,
            curso,
            paralelo
        };
    }

    return {
        valido: true,
        mensaje: "",
        curso,
        paralelo
    };
}
