import { db, auth } from "./firebase-config.js";

import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const COLECCIONES = {
    USUARIOS: "usuarios",
    ESTUDIANTES: "estudiantes",
    EVALUACIONES: "evaluaciones",
    CURSOS: "cursos",
    ACTIVIDADES: "actividades",
    RECURSOS: "recursos",
    NOTIFICACIONES: "notificaciones",
    ANALYTICS: "analytics"
};

function sinUndefined(obj = {}) {
    return Object.fromEntries(Object.entries(obj).filter(([, valor]) => valor !== undefined));
}

function desdeDocumento(documento) {
    return {
        id: documento.id,
        ...documento.data()
    };
}

function sesionActiva() {
    if (!auth.currentUser) {
        throw new Error("No existe una sesión activa.");
    }

    return auth.currentUser;
}

function ordenarPorFechaDesc(lista, campo = "fechaCreacion") {
    return [...lista].sort((a, b) => {
        const fechaA = a?.[campo]?.seconds || 0;
        const fechaB = b?.[campo]?.seconds || 0;
        return fechaB - fechaA;
    });
}

// =========================
// USUARIOS
// =========================
export async function crearUsuario(uid, datos) {
    await setDoc(doc(db, COLECCIONES.USUARIOS, uid), {
        ...sinUndefined(datos),
        fechaRegistro: datos?.fechaRegistro || serverTimestamp()
    }, { merge: true });

    return obtenerUsuario(uid);
}

export async function obtenerUsuario(uid) {
    const documento = await getDoc(doc(db, COLECCIONES.USUARIOS, uid));
    return documento.exists() ? desdeDocumento(documento) : null;
}

export async function actualizarUsuario(uid, datos) {
    await updateDoc(doc(db, COLECCIONES.USUARIOS, uid), sinUndefined(datos));
    return obtenerUsuario(uid);
}

// =========================
// ESTUDIANTES
// =========================
export async function crearEstudiante(datos) {
    const usuario = sesionActiva();

    const referencia = await addDoc(collection(db, COLECCIONES.ESTUDIANTES), {
        ...sinUndefined(datos),
        docenteId: datos?.docenteId || usuario.uid,
        estado: datos?.estado || "activo",
        fechaRegistro: serverTimestamp(),
        fechaActualizacion: serverTimestamp()
    });

    const documento = await getDoc(referencia);
    return desdeDocumento(documento);
}

export async function obtenerEstudiantes(filtros = {}) {
    const usuario = auth.currentUser;
    const esAdmin = filtros.rol === "admin";

    let consulta = collection(db, COLECCIONES.ESTUDIANTES);

    if (usuario && !esAdmin) {
        consulta = query(consulta, where("docenteId", "==", usuario.uid));
    }

    if (filtros.cursoId) {
        consulta = query(consulta, where("cursoId", "==", filtros.cursoId));
    }

    const snapshot = await getDocs(consulta);
    const estudiantes = snapshot.docs.map(desdeDocumento);

    return ordenarPorFechaDesc(estudiantes, "fechaRegistro");
}

export async function actualizarEstudiante(id, datos) {
    await updateDoc(doc(db, COLECCIONES.ESTUDIANTES, id), {
        ...sinUndefined(datos),
        fechaActualizacion: serverTimestamp()
    });

    const actualizado = await getDoc(doc(db, COLECCIONES.ESTUDIANTES, id));
    return actualizado.exists() ? desdeDocumento(actualizado) : null;
}

export async function eliminarEstudiante(id) {
    await deleteDoc(doc(db, COLECCIONES.ESTUDIANTES, id));
    return { ok: true };
}

// =========================
// EVALUACIONES
// =========================
export async function crearEvaluacion(datos) {
    const usuario = sesionActiva();

    const referencia = await addDoc(collection(db, COLECCIONES.EVALUACIONES), {
        ...sinUndefined(datos),
        docenteId: datos?.docenteId || usuario.uid,
        fecha: datos?.fecha || serverTimestamp(),
        fechaCreacion: serverTimestamp()
    });

    const documento = await getDoc(referencia);
    return desdeDocumento(documento);
}

export async function obtenerEvaluaciones(filtros = {}) {
    const usuario = auth.currentUser;
    const esAdmin = filtros.rol === "admin";

    let consulta = collection(db, COLECCIONES.EVALUACIONES);

    if (usuario && !esAdmin) {
        consulta = query(consulta, where("docenteId", "==", usuario.uid));
    }

    if (filtros.estudianteId) {
        consulta = query(consulta, where("estudianteId", "==", filtros.estudianteId));
    }

    if (filtros.cursoId) {
        consulta = query(consulta, where("cursoId", "==", filtros.cursoId));
    }

    const snapshot = await getDocs(consulta);
    return ordenarPorFechaDesc(snapshot.docs.map(desdeDocumento), "fechaCreacion");
}

export async function actualizarEvaluacion(id, datos) {
    await updateDoc(doc(db, COLECCIONES.EVALUACIONES, id), {
        ...sinUndefined(datos),
        fechaActualizacion: serverTimestamp()
    });

    const actualizado = await getDoc(doc(db, COLECCIONES.EVALUACIONES, id));
    return actualizado.exists() ? desdeDocumento(actualizado) : null;
}

// =========================
// CURSOS
// =========================
export async function crearCurso(datos) {
    const usuario = sesionActiva();

    const referencia = await addDoc(collection(db, COLECCIONES.CURSOS), {
        ...sinUndefined(datos),
        docenteId: datos?.docenteId || usuario.uid,
        estudianteIds: datos?.estudianteIds || [],
        totalEstudiantes: datos?.totalEstudiantes || 0,
        totalEvaluaciones: datos?.totalEvaluaciones || 0,
        fechaCreacion: serverTimestamp(),
        fechaActualizacion: serverTimestamp()
    });

    const documento = await getDoc(referencia);
    return desdeDocumento(documento);
}

export async function obtenerCursos(filtros = {}) {
    const usuario = auth.currentUser;
    const esAdmin = filtros.rol === "admin";

    let consulta = collection(db, COLECCIONES.CURSOS);

    if (usuario && !esAdmin) {
        consulta = query(consulta, where("docenteId", "==", usuario.uid));
    }

    const snapshot = await getDocs(consulta);
    return ordenarPorFechaDesc(snapshot.docs.map(desdeDocumento), "fechaCreacion");
}

export async function actualizarCurso(id, datos) {
    await updateDoc(doc(db, COLECCIONES.CURSOS, id), {
        ...sinUndefined(datos),
        fechaActualizacion: serverTimestamp()
    });

    const actualizado = await getDoc(doc(db, COLECCIONES.CURSOS, id));
    return actualizado.exists() ? desdeDocumento(actualizado) : null;
}

// =========================
// ACTIVIDADES
// =========================
export async function crearActividad(datos) {
    const referencia = await addDoc(collection(db, COLECCIONES.ACTIVIDADES), {
        ...sinUndefined(datos),
        fechaCreacion: serverTimestamp()
    });

    const documento = await getDoc(referencia);
    return desdeDocumento(documento);
}

export async function obtenerActividades(filtros = {}) {
    let consulta = collection(db, COLECCIONES.ACTIVIDADES);

    if (filtros.nivel) {
        consulta = query(consulta, where("nivel", "==", filtros.nivel));
    }

    const snapshot = await getDocs(consulta);
    return ordenarPorFechaDesc(snapshot.docs.map(desdeDocumento), "fechaCreacion");
}

// =========================
// RECURSOS
// =========================
export async function crearRecurso(datos) {
    const usuario = sesionActiva();
    const referencia = await addDoc(collection(db, COLECCIONES.RECURSOS), {
        ...sinUndefined(datos),
        docenteId: datos?.docenteId || usuario.uid,
        fechaCreacion: serverTimestamp(),
        fechaActualizacion: serverTimestamp()
    });

    const documento = await getDoc(referencia);
    return desdeDocumento(documento);
}

export async function obtenerRecursos(filtros = {}) {
    const usuario = auth.currentUser;
    const esAdmin = filtros.rol === "admin";
    let consulta = collection(db, COLECCIONES.RECURSOS);

    if (usuario && !esAdmin) {
        consulta = query(consulta, where("docenteId", "==", usuario.uid));
    }

    const snapshot = await getDocs(consulta);
    return ordenarPorFechaDesc(snapshot.docs.map(desdeDocumento), "fechaCreacion");
}

// =========================
// NOTIFICACIONES
// =========================
export async function crearNotificacion(datos) {
    const usuario = sesionActiva();
    const referencia = await addDoc(collection(db, COLECCIONES.NOTIFICACIONES), {
        ...sinUndefined(datos),
        docenteId: datos?.docenteId || usuario.uid,
        leida: Boolean(datos?.leida),
        fechaCreacion: serverTimestamp()
    });

    const documento = await getDoc(referencia);
    return desdeDocumento(documento);
}

export async function obtenerNotificaciones(filtros = {}) {
    const usuario = sesionActiva();
    const consulta = query(
        collection(db, COLECCIONES.NOTIFICACIONES),
        where("docenteId", "==", filtros.docenteId || usuario.uid)
    );

    const snapshot = await getDocs(consulta);
    const limiteFecha = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const lista = snapshot.docs.map(desdeDocumento).filter((notificacion) => {
        const fecha = (notificacion?.fechaCreacion?.seconds || 0) * 1000;
        return !fecha || fecha >= limiteFecha;
    });

    return ordenarPorFechaDesc(lista, "fechaCreacion");
}

export async function marcarNotificacionLeida(id) {
    await updateDoc(doc(db, COLECCIONES.NOTIFICACIONES, id), {
        leida: true,
        fechaActualizacion: serverTimestamp()
    });
}

export async function limpiarNotificacionesAntiguas() {
    const lista = await obtenerNotificaciones();
    const treintaDias = 30 * 24 * 60 * 60 * 1000;
    const ahora = Date.now();
    const aEliminar = lista.filter((item) => {
        const fecha = (item?.fechaCreacion?.seconds || 0) * 1000;
        return fecha && (ahora - fecha) > treintaDias;
    });

    await Promise.all(aEliminar.map((item) => deleteDoc(doc(db, COLECCIONES.NOTIFICACIONES, item.id))));
    return { eliminadas: aEliminar.length };
}

// =========================
// ANALYTICS
// =========================
export async function registrarEventoAnalytics(datos) {
    const usuario = auth.currentUser;
    await addDoc(collection(db, COLECCIONES.ANALYTICS), {
        ...sinUndefined(datos),
        docenteId: datos?.docenteId || usuario?.uid || "anonimo",
        timestamp: serverTimestamp()
    });
}

// Compatibilidad con módulos existentes
export async function listarCursos() {
    return obtenerCursos();
}

export async function obtenerCurso(id) {
    const documento = await getDoc(doc(db, COLECCIONES.CURSOS, id));
    return documento.exists() ? desdeDocumento(documento) : null;
}

export async function eliminarCurso(id) {
    await deleteDoc(doc(db, COLECCIONES.CURSOS, id));
    return { ok: true };
}
