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
    serverTimestamp,
    limit,
    orderBy,
    writeBatch
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const COLECCIONES = {
    USUARIOS: "usuarios",
    PERIODOS: "periodos",
    ESTUDIANTES: "estudiantes",
    EVALUACIONES: "evaluaciones",
    CURSOS: "cursos",
    PARALELOS: "paralelos",
    DIAGNOSTICOS: "diagnosticos",
    PLANES_INTERVENCION: "planesIntervención",
    ACTIVIDADES: "actividades",
    RECURSOS: "recursos",
    GUIAS: "guias",
    BIBLIOTECA: "biblioteca",
    SEGUIMIENTO: "seguimiento",
    NOTIFICACIONES: "notificaciones",
    ANALYTICS: "analytics"
};

function sinUndefined(obj = {}) {
    return Object.fromEntries(
        Object.entries(obj).filter(([, valor]) => valor !== undefined)
    );
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

function obtenerValorFecha(registro = {}, campo = "createdAt") {
    return (
        registro?.[campo]?.seconds ||
        registro?.createdAt?.seconds ||
        registro?.fechaCreacion?.seconds ||
        registro?.fechaRegistro?.seconds ||
        0
    );
}

function ordenarPorFechaDesc(lista, campo = "createdAt") {
    return [...lista].sort((a, b) => obtenerValorFecha(b, campo) - obtenerValorFecha(a, campo));
}

function ordenarAlfabeticamente(lista, campo = "nombre") {
    return [...lista].sort((a, b) => String(a?.[campo] || "").localeCompare(String(b?.[campo] || ""), "es"));
}

function construirConsulta(coleccionNombre, filtros = {}, opciones = {}) {
    const usuario = auth.currentUser;
    const restricciones = [];
    const incluirDocente = opciones.incluirDocente !== false;
    const esAdmin = opciones.rol === "admin";

    if (usuario && incluirDocente && !esAdmin) {
        restricciones.push(where("docenteId", "==", usuario.uid));
    }

    Object.entries(filtros).forEach(([campo, valor]) => {
        if (valor !== undefined && valor !== null && valor !== "") {
            restricciones.push(where(campo, "==", valor));
        }
    });

    return restricciones.length
        ? query(collection(db, coleccionNombre), ...restricciones)
        : collection(db, coleccionNombre);
}

async function obtenerLista(coleccionNombre, filtros = {}, opciones = {}) {
    const snapshot = await getDocs(construirConsulta(coleccionNombre, filtros, opciones));
    const lista = snapshot.docs.map(desdeDocumento);

    if (opciones.orden === "nombre") {
        return ordenarAlfabeticamente(lista, opciones.campoOrden || "nombre");
    }

    return ordenarPorFechaDesc(lista, opciones.campoOrden || "createdAt");
}

async function buscarDuplicado(coleccionNombre, filtros = {}, opciones = {}) {
    const consultaBase = construirConsulta(coleccionNombre, filtros, {
        incluirDocente: opciones.incluirDocente,
        rol: opciones.rol
    });

    const consulta = query(consultaBase, limit(5));
    const snapshot = await getDocs(consulta);

    return snapshot.docs
        .map(desdeDocumento)
        .find((item) => item.id !== opciones.excluirId) || null;
}

export async function obtenerCurso(id) {
    const documento = await getDoc(doc(db, COLECCIONES.CURSOS, id));
    return documento.exists() ? desdeDocumento(documento) : null;
}

export async function obtenerParalelo(id) {
    const documento = await getDoc(doc(db, COLECCIONES.PARALELOS, id));
    return documento.exists() ? desdeDocumento(documento) : null;
}

export async function obtenerPeriodo(id) {
    const documento = await getDoc(doc(db, COLECCIONES.PERIODOS, id));
    return documento.exists() ? desdeDocumento(documento) : null;
}

async function asegurarPeriodoExiste(periodoId) {
    const periodo = await obtenerPeriodo(periodoId);
    if (!periodo) {
        throw new Error("El período seleccionado no existe.");
    }
    return periodo;
}

async function asegurarCursoExiste(cursoId) {
    const curso = await obtenerCurso(cursoId);
    if (!curso) {
        throw new Error("El curso seleccionado no existe.");
    }
    return curso;
}

async function asegurarParaleloValido(cursoId, paraleloId) {
    const paralelo = await obtenerParalelo(paraleloId);

    if (!paralelo) {
        throw new Error("El paralelo seleccionado no existe.");
    }

    if (paralelo.cursoId !== cursoId) {
        throw new Error("El paralelo seleccionado no pertenece al curso indicado.");
    }

    return paralelo;
}

async function asegurarPeriodoNoDuplicado(datos, excluirId = null) {
    if (!datos?.nombre) {
        return;
    }

    const duplicado = await buscarDuplicado(COLECCIONES.PERIODOS, {
        nombre: datos.nombre
    }, {
        incluirDocente: false,
        excluirId
    });

    if (duplicado) {
        throw new Error("Ya existe un período con ese nombre.");
    }
}

async function asegurarCursoNoDuplicado(datos, excluirId = null) {
    if (!datos?.nombre) {
        return;
    }

    const usuario = auth.currentUser;
    const duplicado = await buscarDuplicado(COLECCIONES.CURSOS, {
        nombre: datos.nombre,
        docenteId: datos?.docenteId || usuario?.uid || null
    }, {
        incluirDocente: false,
        excluirId
    });

    if (duplicado) {
        throw new Error("Ya existe un curso registrado con ese nombre.");
    }
}

async function asegurarParaleloNoDuplicado(datos, excluirId = null) {
    if (!datos?.cursoId || !datos?.nombre) {
        return;
    }

    const usuario = auth.currentUser;
    const duplicado = await buscarDuplicado(COLECCIONES.PARALELOS, {
        cursoId: datos.cursoId,
        nombre: datos.nombre,
        docenteId: datos?.docenteId || usuario?.uid || null
    }, {
        incluirDocente: false,
        excluirId
    });

    if (duplicado) {
        throw new Error("Ya existe ese paralelo dentro del curso seleccionado.");
    }
}

async function asegurarCedulaDisponible(cedula, excluirId = null) {
    if (!cedula) {
        return;
    }

    const duplicado = await buscarDuplicado(COLECCIONES.ESTUDIANTES, { cedula }, {
        incluirDocente: false,
        excluirId
    });

    if (duplicado) {
        throw new Error("Ya existe un estudiante registrado con esa cédula.");
    }
}

function construirCamposAuditoria(datos = {}, usuario = null) {
    return {
        ...sinUndefined(datos),
        docenteId: datos?.docenteId || usuario?.uid,
        createdAt: datos?.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
        fechaCreacion: datos?.fechaCreacion || serverTimestamp(),
        fechaActualizacion: serverTimestamp()
    };
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
// PERIODOS LECTIVOS (NUEVO)
// =========================
export async function crearPeriodo(datos) {
    const usuario = sesionActiva();
    await asegurarPeriodoNoDuplicado(datos);

    const referencia = await addDoc(collection(db, COLECCIONES.PERIODOS), {
        ...construirCamposAuditoria({
            ...datos,
            estado: datos?.estado || "activo"
        }, usuario)
    });

    const documento = await getDoc(referencia);
    return desdeDocumento(documento);
}

export async function obtenerPeriodos(filtros = {}) {
    return obtenerLista(COLECCIONES.PERIODOS, {
        estado: filtros.estado
    }, {
        rol: filtros.rol,
        orden: "nombre",
        campoOrden: "nombre"
    });
}

export async function actualizarPeriodo(id, datos) {
    await asegurarPeriodoNoDuplicado(datos, id);

    await updateDoc(doc(db, COLECCIONES.PERIODOS, id), {
        ...sinUndefined(datos),
        updatedAt: serverTimestamp(),
        fechaActualizacion: serverTimestamp()
    });

    return obtenerPeriodo(id);
}

export async function eliminarPeriodo(id) {
    const [cursos, estudiantes] = await Promise.all([
        obtenerCursos({ periodoId: id }),
        obtenerEstudiantes({ periodoId: id })
    ]);

    if (cursos.length) {
        throw new Error("No se puede eliminar el período porque tiene cursos asociados.");
    }

    if (estudiantes.length) {
        throw new Error("No se puede eliminar el período porque tiene estudiantes asociados.");
    }

    await deleteDoc(doc(db, COLECCIONES.PERIODOS, id));
    return { ok: true };
}

// =========================
// CURSOS
// =========================
export async function crearCurso(datos) {
    const usuario = sesionActiva();
    await asegurarCursoNoDuplicado(datos);
    
    if (datos?.periodoId) {
        await asegurarPeriodoExiste(datos.periodoId);
    }

    const referencia = await addDoc(collection(db, COLECCIONES.CURSOS), {
        ...construirCamposAuditoria({
            ...datos,
            estado: datos?.estado || "activo",
            totalEstudiantes: datos?.totalEstudiantes || 0,
            totalParalelos: datos?.totalParalelos || 0
        }, usuario)
    });

    const documento = await getDoc(referencia);
    return desdeDocumento(documento);
}

export async function obtenerCursos(filtros = {}) {
    return obtenerLista(COLECCIONES.CURSOS, {
        estado: filtros.estado,
        nivel: filtros.nivel,
        periodoId: filtros.periodoId
    }, {
        rol: filtros.rol,
        orden: "nombre",
        campoOrden: "nombre"
    });
}

export async function actualizarCurso(id, datos) {
    await asegurarCursoNoDuplicado(datos, id);
    
    if (datos?.periodoId) {
        await asegurarPeriodoExiste(datos.periodoId);
    }

    await updateDoc(doc(db, COLECCIONES.CURSOS, id), {
        ...sinUndefined(datos),
        updatedAt: serverTimestamp(),
        fechaActualizacion: serverTimestamp()
    });

    return obtenerCurso(id);
}

export async function eliminarCurso(id) {
    const [paralelos, estudiantes] = await Promise.all([
        obtenerParalelos({ cursoId: id }),
        obtenerEstudiantes({ cursoId: id })
    ]);

    if (paralelos.length) {
        throw new Error("No se puede eliminar el curso porque tiene paralelos asociados.");
    }

    if (estudiantes.length) {
        throw new Error("No se puede eliminar el curso porque tiene estudiantes asociados.");
    }

    await deleteDoc(doc(db, COLECCIONES.CURSOS, id));
    return { ok: true };
}

// =========================
// PARALELOS
// =========================
export async function crearParalelo(datos) {
    const usuario = sesionActiva();

    if (!datos?.cursoId) {
        throw new Error("Debe seleccionar un curso para crear el paralelo.");
    }

    await asegurarCursoExiste(datos.cursoId);
    await asegurarParaleloNoDuplicado(datos);

    const referencia = await addDoc(collection(db, COLECCIONES.PARALELOS), {
        ...construirCamposAuditoria({
            ...datos,
            estado: datos?.estado || "activo"
        }, usuario)
    });

    const documento = await getDoc(referencia);
    return desdeDocumento(documento);
}

export async function obtenerParalelos(filtros = {}) {
    return obtenerLista(COLECCIONES.PARALELOS, {
        cursoId: filtros.cursoId,
        estado: filtros.estado
    }, {
        rol: filtros.rol,
        orden: "nombre",
        campoOrden: "nombre"
    });
}

export async function obtenerParalelosPorCurso(cursoId) {
    return obtenerParalelos({ cursoId });
}

export async function actualizarParalelo(id, datos) {
    if (datos?.cursoId) {
        await asegurarCursoExiste(datos.cursoId);
    }

    await asegurarParaleloNoDuplicado({
        ...datos,
        cursoId: datos?.cursoId || (await obtenerParalelo(id))?.cursoId
    }, id);

    await updateDoc(doc(db, COLECCIONES.PARALELOS, id), {
        ...sinUndefined(datos),
        updatedAt: serverTimestamp(),
        fechaActualizacion: serverTimestamp()
    });

    return obtenerParalelo(id);
}

export async function eliminarParalelo(id) {
    const estudiantes = await obtenerEstudiantes({ paraleloId: id });

    if (estudiantes.length) {
        throw new Error("No se puede eliminar el paralelo porque tiene estudiantes asociados.");
    }

    await deleteDoc(doc(db, COLECCIONES.PARALELOS, id));
    return { ok: true };
}

// =========================
// ESTUDIANTES
// =========================
export async function crearEstudiante(datos) {
    const usuario = sesionActiva();

    if (!datos?.periodoId) {
        throw new Error("Debe seleccionar un período.");
    }

    if (!datos?.cursoId) {
        throw new Error("Debe seleccionar un curso.");
    }

    if (!datos?.paraleloId) {
        throw new Error("Debe seleccionar un paralelo.");
    }

    const [periodo, curso] = await Promise.all([
        asegurarPeriodoExiste(datos.periodoId),
        asegurarCursoExiste(datos.cursoId),
        asegurarParaleloValido(datos.cursoId, datos.paraleloId),
        asegurarCedulaDisponible(datos?.cedula)
    ]);

    const referencia = await addDoc(collection(db, COLECCIONES.ESTUDIANTES), {
        ...construirCamposAuditoria({
            ...datos,
            nivel: datos?.nivel || curso?.nivel || "",
            estado: datos?.estado || "activo",
            tiposDisgrafia: datos?.tiposDisgrafia || (datos?.disgrafia ? [datos.disgrafia] : [])
        }, usuario),
        fechaRegistro: serverTimestamp()
    });

    const documento = await getDoc(referencia);
    return desdeDocumento(documento);
}

export async function obtenerEstudiantes(filtros = {}) {
    return obtenerLista(COLECCIONES.ESTUDIANTES, {
        cursoId: filtros.cursoId,
        paraleloId: filtros.paraleloId,
        periodoId: filtros.periodoId,
        estado: filtros.estado
    }, {
        rol: filtros.rol,
        campoOrden: "fechaRegistro"
    });
}

export async function actualizarEstudiante(id, datos) {
    const actual = await getDoc(doc(db, COLECCIONES.ESTUDIANTES, id));

    if (!actual.exists()) {
        throw new Error("El estudiante no existe.");
    }

    const previo = desdeDocumento(actual);
    const periodoId = datos?.periodoId || previo.periodoId;
    const cursoId = datos?.cursoId || previo.cursoId;
    const paraleloId = datos?.paraleloId || previo.paraleloId;
    const cedulaFinal = Object.prototype.hasOwnProperty.call(datos || {}, "cedula")
        ? datos.cedula
        : previo?.cedula;

    if (!periodoId || !cursoId || !paraleloId) {
        throw new Error("El estudiante debe conservar período, curso y paralelo.");
    }

    const curso = await asegurarCursoExiste(cursoId);
    await asegurarPeriodoExiste(periodoId);
    await asegurarParaleloValido(cursoId, paraleloId);
    await asegurarCedulaDisponible(cedulaFinal, id);

    await updateDoc(doc(db, COLECCIONES.ESTUDIANTES, id), {
        ...sinUndefined({
            ...datos,
            periodoId,
            cursoId,
            paraleloId,
            cedula: cedulaFinal,
            nivel: datos?.nivel || previo?.nivel || curso?.nivel || ""
        }),
        updatedAt: serverTimestamp(),
        fechaActualizacion: serverTimestamp()
    });

    const actualizado = await getDoc(doc(db, COLECCIONES.ESTUDIANTES, id));
    return actualizado.exists() ? desdeDocumento(actualizado) : null;
}

export async function eliminarEstudiante(id) {
    const evaluaciones = await obtenerEvaluaciones({ estudianteId: id });
    if (evaluaciones.length) {
        throw new Error("No se puede eliminar el estudiante porque tiene evaluaciones asociadas.");
    }

    await deleteDoc(doc(db, COLECCIONES.ESTUDIANTES, id));
    return { ok: true };
}

// =========================
// EVALUACIONES
// =========================
export async function crearEvaluacion(datos) {
    const usuario = sesionActiva();

    if (!datos?.estudianteId || !datos?.cursoId || !datos?.paraleloId) {
        throw new Error("La evaluación debe incluir estudiante, curso y paralelo.");
    }

    await asegurarCursoExiste(datos.cursoId);
    await asegurarParaleloValido(datos.cursoId, datos.paraleloId);

    const referencia = await addDoc(collection(db, COLECCIONES.EVALUACIONES), {
        ...sinUndefined(datos),
        docenteId: datos?.docenteId || usuario.uid,
        fecha: datos?.fecha || serverTimestamp(),
        createdAt: serverTimestamp(),
        fechaCreacion: serverTimestamp()
    });

    const documento = await getDoc(referencia);
    return desdeDocumento(documento);
}

export async function obtenerEvaluaciones(filtros = {}) {
    return obtenerLista(COLECCIONES.EVALUACIONES, {
        estudianteId: filtros.estudianteId,
        cursoId: filtros.cursoId,
        paraleloId: filtros.paraleloId,
        periodoId: filtros.periodoId
    }, {
        rol: filtros.rol,
        campoOrden: "fechaCreacion"
    });
}

export async function actualizarEvaluacion(id, datos) {
    await updateDoc(doc(db, COLECCIONES.EVALUACIONES, id), {
        ...sinUndefined(datos),
        updatedAt: serverTimestamp(),
        fechaActualizacion: serverTimestamp()
    });

    const actualizado = await getDoc(doc(db, COLECCIONES.EVALUACIONES, id));
    return actualizado.exists() ? desdeDocumento(actualizado) : null;
}

export async function eliminarEvaluacion(id) {
    const diagnosticos = await obtenerDiagnosticos({ evaluacionId: id });
    if (diagnosticos.length) {
        throw new Error("No se puede eliminar la evaluación porque tiene diagnósticos asociados.");
    }

    await deleteDoc(doc(db, COLECCIONES.EVALUACIONES, id));
    return { ok: true };
}

// =========================
// DIAGNÓSTICOS (NUEVO)
// =========================
export async function crearDiagnostico(datos) {
    const usuario = sesionActiva();

    if (!datos?.estudianteId) {
        throw new Error("El diagnóstico debe incluir un estudiante.");
    }

    const referencia = await addDoc(collection(db, COLECCIONES.DIAGNOSTICOS), {
        ...construirCamposAuditoria({
            ...datos,
            nivelRiesgo: datos?.nivelRiesgo || "bajo",
            requiereDerivacion: datos?.requiereDerivacion || false
        }, usuario)
    });

    const documento = await getDoc(referencia);
    return desdeDocumento(documento);
}

export async function obtenerDiagnosticos(filtros = {}) {
    return obtenerLista(COLECCIONES.DIAGNOSTICOS, {
        estudianteId: filtros.estudianteId,
        tipo: filtros.tipo,
        periodoId: filtros.periodoId
    }, {
        rol: filtros.rol,
        campoOrden: "createdAt"
    });
}

export async function obtenerDiagnostico(id) {
    const documento = await getDoc(doc(db, COLECCIONES.DIAGNOSTICOS, id));
    return documento.exists() ? desdeDocumento(documento) : null;
}

export async function actualizarDiagnostico(id, datos) {
    await updateDoc(doc(db, COLECCIONES.DIAGNOSTICOS, id), {
        ...sinUndefined(datos),
        updatedAt: serverTimestamp(),
        fechaActualizacion: serverTimestamp()
    });

    return obtenerDiagnostico(id);
}

export async function eliminarDiagnostico(id) {
    const planes = await obtenerPlanesIntervención({ diagnosticoId: id });
    if (planes.length) {
        throw new Error("No se puede eliminar el diagnóstico porque tiene planes asociados.");
    }

    await deleteDoc(doc(db, COLECCIONES.DIAGNOSTICOS, id));
    return { ok: true };
}

// =========================
// PLANES DE INTERVENCIÓN (NUEVO)
// =========================
export async function crearPlanIntervención(datos) {
    const usuario = sesionActiva();

    if (!datos?.estudianteId) {
        throw new Error("El plan debe incluir un estudiante.");
    }

    const referencia = await addDoc(collection(db, COLECCIONES.PLANES_INTERVENCION), {
        ...construirCamposAuditoria({
            ...datos,
            estado: datos?.estado || "activo",
            actividades: datos?.actividades || []
        }, usuario)
    });

    const documento = await getDoc(referencia);
    return desdeDocumento(documento);
}

export async function obtenerPlanesIntervención(filtros = {}) {
    return obtenerLista(COLECCIONES.PLANES_INTERVENCION, {
        estudianteId: filtros.estudianteId,
        diagnosticoId: filtros.diagnosticoId,
        estado: filtros.estado,
        periodoId: filtros.periodoId
    }, {
        rol: filtros.rol,
        campoOrden: "createdAt"
    });
}

export async function obtenerPlanIntervención(id) {
    const documento = await getDoc(doc(db, COLECCIONES.PLANES_INTERVENCION, id));
    return documento.exists() ? desdeDocumento(documento) : null;
}

export async function actualizarPlanIntervención(id, datos) {
    await updateDoc(doc(db, COLECCIONES.PLANES_INTERVENCION, id), {
        ...sinUndefined(datos),
        updatedAt: serverTimestamp(),
        fechaActualizacion: serverTimestamp()
    });

    return obtenerPlanIntervención(id);
}

export async function agregarActividadAlPlan(planId, actividad) {
    const plan = await obtenerPlanIntervención(planId);
    if (!plan) {
        throw new Error("El plan no existe.");
    }

    const actividades = plan.actividades || [];
    actividades.push({
        ...actividad,
        orden: actividades.length + 1,
        estado: "pendiente"
    });

    return actualizarPlanIntervención(planId, { actividades });
}

export async function eliminarPlanIntervención(id) {
    const seguimientos = await obtenerSeguimientos({ planId: id });
    if (seguimientos.length && seguimientos.some(s => !s.archived)) {
        throw new Error("No se puede eliminar un plan activo con seguimiento.");
    }

    await deleteDoc(doc(db, COLECCIONES.PLANES_INTERVENCION, id));
    return { ok: true };
}

// =========================
// ACTIVIDADES
// =========================
export async function crearActividad(datos) {
    const referencia = await addDoc(collection(db, COLECCIONES.ACTIVIDADES), {
        ...sinUndefined(datos),
        createdAt: serverTimestamp(),
        fechaCreacion: serverTimestamp()
    });

    const documento = await getDoc(referencia);
    return desdeDocumento(documento);
}

export async function obtenerActividades(filtros = {}) {
    return obtenerLista(COLECCIONES.ACTIVIDADES, {
        nivel: filtros.nivel,
        tipo: filtros.tipo,
        disgrafia: filtros.disgrafia
    }, {
        campoOrden: "fechaCreacion"
    });
}

export async function obtenerActividad(id) {
    const documento = await getDoc(doc(db, COLECCIONES.ACTIVIDADES, id));
    return documento.exists() ? desdeDocumento(documento) : null;
}

export async function actualizarActividad(id, datos) {
    await updateDoc(doc(db, COLECCIONES.ACTIVIDADES, id), {
        ...sinUndefined(datos),
        updatedAt: serverTimestamp(),
        fechaActualizacion: serverTimestamp()
    });

    return obtenerActividad(id);
}

// =========================
// RECURSOS
// =========================
export async function crearRecurso(datos) {
    const usuario = sesionActiva();
    const referencia = await addDoc(collection(db, COLECCIONES.RECURSOS), {
        ...construirCamposAuditoria({
            ...datos,
            downloadCount: 0,
            rating: 0
        }, usuario)
    });

    const documento = await getDoc(referencia);
    return desdeDocumento(documento);
}

export async function obtenerRecursos(filtros = {}) {
    return obtenerLista(COLECCIONES.RECURSOS, {
        tipo: filtros.tipo
    }, {
        rol: filtros.rol,
        campoOrden: "createdAt"
    });
}

export async function obtenerRecurso(id) {
    const documento = await getDoc(doc(db, COLECCIONES.RECURSOS, id));
    return documento.exists() ? desdeDocumento(documento) : null;
}

export async function actualizarRecurso(id, datos) {
    await updateDoc(doc(db, COLECCIONES.RECURSOS, id), {
        ...sinUndefined(datos),
        updatedAt: serverTimestamp(),
        fechaActualizacion: serverTimestamp()
    });

    return obtenerRecurso(id);
}

// =========================
// GUÍAS
// =========================
export async function crearGuia(datos) {
    const usuario = sesionActiva();
    const referencia = await addDoc(collection(db, COLECCIONES.GUIAS), {
        ...construirCamposAuditoria(datos, usuario)
    });

    const documento = await getDoc(referencia);
    return desdeDocumento(documento);
}

export async function obtenerGuias(filtros = {}) {
    return obtenerLista(COLECCIONES.GUIAS, {
        nivel: filtros.nivel,
        tipo: filtros.tipo
    }, {
        campoOrden: "createdAt"
    });
}

export async function obtenerGuia(id) {
    const documento = await getDoc(doc(db, COLECCIONES.GUIAS, id));
    return documento.exists() ? desdeDocumento(documento) : null;
}

// =========================
// BIBLIOTECA (NUEVO)
// =========================
export async function crearArticuloBiblioteca(datos) {
    const referencia = await addDoc(collection(db, COLECCIONES.BIBLIOTECA), {
        ...sinUndefined(datos),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });

    const documento = await getDoc(referencia);
    return desdeDocumento(documento);
}

export async function obtenerArticulosBiblioteca(filtros = {}) {
    return obtenerLista(COLECCIONES.BIBLIOTECA, {
        categoria: filtros.categoria,
        tipo: filtros.tipo
    }, {
        orden: "nombre",
        campoOrden: "titulo"
    });
}

export async function obtenerArticuloBiblioteca(id) {
    const documento = await getDoc(doc(db, COLECCIONES.BIBLIOTECA, id));
    return documento.exists() ? desdeDocumento(documento) : null;
}

export async function buscarEnBiblioteca(termino) {
    const snapshot = await getDocs(collection(db, COLECCIONES.BIBLIOTECA));
    const articulos = snapshot.docs.map(desdeDocumento);

    const terminoLower = termino.toLowerCase();
    return articulos.filter(articulo =>
        articulo.titulo?.toLowerCase().includes(terminoLower) ||
        articulo.resumen?.toLowerCase().includes(terminoLower) ||
        articulo.etiquetas?.some(tag => tag.toLowerCase().includes(terminoLower))
    );
}

// =========================
// SEGUIMIENTO (NUEVO)
// =========================
export async function crearRegistroSeguimiento(datos) {
    const usuario = sesionActiva();
    const referencia = await addDoc(collection(db, COLECCIONES.SEGUIMIENTO), {
        ...construirCamposAuditoria(datos, usuario)
    });

    const documento = await getDoc(referencia);
    return desdeDocumento(documento);
}

export async function obtenerSeguimientos(filtros = {}) {
    return obtenerLista(COLECCIONES.SEGUIMIENTO, {
        estudianteId: filtros.estudianteId,
        planId: filtros.planId,
        tipo: filtros.tipo
    }, {
        campoOrden: "createdAt"
    });
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
        createdAt: serverTimestamp(),
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
        const fecha = (notificacion?.fechaCreacion?.seconds || notificacion?.createdAt?.seconds || 0) * 1000;
        return !fecha || fecha >= limiteFecha;
    });

    return ordenarPorFechaDesc(lista, "fechaCreacion");
}

export async function marcarNotificacionLeida(id) {
    await updateDoc(doc(db, COLECCIONES.NOTIFICACIONES, id), {
        leida: true,
        updatedAt: serverTimestamp(),
        fechaActualizacion: serverTimestamp()
    });
}

export async function limpiarNotificacionesAntiguas() {
    const lista = await obtenerNotificaciones();
    const treintaDias = 30 * 24 * 60 * 60 * 1000;
    const ahora = Date.now();
    const aEliminar = lista.filter((item) => {
        const fecha = (item?.fechaCreacion?.seconds || item?.createdAt?.seconds || 0) * 1000;
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

export async function listarParalelos() {
    return obtenerParalelos();
}

export async function listarPeriodos() {
    return obtenerPeriodos();
}
