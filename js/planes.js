import {
    crearPlanServicio,
    obtenerPlanesServicio,
    obtenerPlanPorIdServicio,
    actualizarPlanServicio,
    eliminarPlanServicio,
    agregarObjetivoServicio,
    eliminarObjetivoServicio,
    agregarActividadServicio,
    actualizarActividadServicio,
    eliminarActividadServicio,
    marcarActividadCompletadaServicio,
    agregarRegistroSeguimientoServicio,
    obtenerRegistroSeguimientoServicio,
    calcularProgresoServicio,
    obtenerEstadísticasServicio,
    buscarPlanesServicio,
    exportarPlanJSONServicio,
    importarPlanJSONServicio,
    duplicarPlanServicio
} from "../services/planes-service.js";

// ==========================================
// VARIABLES GLOBALES
// ==========================================

let planActual = null;
let planes = [];
let modalPlan = null;
let modalObjetivo = null;
let modalActividad = null;
let modalRegistro = null;
let toastNotificacion = null;

// ==========================================
// INICIALIZACIÓN
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    console.log("🚀 Inicializando página de Planes de Intervención");
    
    // Inicializar modales y toast
    modalPlan = new bootstrap.Modal(document.getElementById("modalPlan"));
    modalObjetivo = new bootstrap.Modal(document.getElementById("modalObjetivo"));
    modalActividad = new bootstrap.Modal(document.getElementById("modalActividad"));
    modalRegistro = new bootstrap.Modal(document.getElementById("modalRegistro"));
    toastNotificacion = new bootstrap.Toast(document.getElementById("toastNotificacion"));
    
    // Event listeners
    configurarEventListeners();
    
    // Cargar planes
    cargarPlanes();
    
    // Establecer fecha actual
    const hoy = new Date().toISOString().split("T")[0];
    document.getElementById("fechaInicio").value = hoy;
    document.getElementById("fechaRegistroActual").textContent = new Date().toLocaleString("es-ES");
});

// ==========================================
// CONFIGURAR EVENT LISTENERS
// ==========================================

function configurarEventListeners() {
    // Botones principales
    document.getElementById("btnNuevoPlan").addEventListener("click", abrirModalNuevoPlan);
    document.getElementById("btnImportar").addEventListener("click", abrirImportador);
    document.getElementById("filtroEstado").addEventListener("change", filtrarPlanes);
    
    // Modal Plan
    document.getElementById("btnGuardarPlan").addEventListener("click", guardarPlan);
    document.getElementById("formPlan").addEventListener("keypress", (e) => {
        if (e.key === "Enter") guardarPlan();
    });
    
    // Botones del plan detalle
    document.getElementById("btnEditarPlan").addEventListener("click", editarPlanActual);
    document.getElementById("btnDuplicarPlan").addEventListener("click", duplicarPlanActual);
    document.getElementById("btnExportarPlan").addEventListener("click", exportarPlanActual);
    document.getElementById("btnEliminarPlan").addEventListener("click", eliminarPlanActual);
    
    // Objetivos
    document.getElementById("btnAgregarObjetivo").addEventListener("click", abrirModalObjetivo);
    document.getElementById("btnGuardarObjetivo").addEventListener("click", guardarObjetivo);
    
    // Actividades
    document.getElementById("btnAgregarActividad").addEventListener("click", abrirModalActividad);
    document.getElementById("btnGuardarActividad").addEventListener("click", guardarActividad);
    
    // Seguimiento
    document.getElementById("btnAgregarRegistro").addEventListener("click", abrirModalRegistro);
    document.getElementById("btnGuardarRegistro").addEventListener("click", guardarRegistro);
    
    // Notas
    document.getElementById("btnGuardarNotas").addEventListener("click", guardarNotas);
}

// ==========================================
// CARGAR Y MOSTRAR PLANES
// ==========================================

async function cargarPlanes() {
    try {
        console.log("📊 Cargando planes...");
        
        planes = await obtenerPlanesServicio();
        
        if (planes.length === 0) {
            mostrarMensajeListaVacia();
        } else {
            mostrarListaPlanes(planes);
        }
    } catch (error) {
        console.error("❌ Error cargando planes:", error);
        mostrarNotificacion("Error al cargar los planes", "danger");
    }
}

function mostrarListaPlanes(planesAMostrar) {
    const listaPlanes = document.getElementById("listaPlanes");
    listaPlanes.innerHTML = "";
    
    planesAMostrar.forEach(plan => {
        const item = document.createElement("div");
        item.className = "list-group-item";
        item.style.cursor = "pointer";
        
        const estadoBadge = obtenerBadgeEstado(plan.estado);
        const tipoBadge = obtenerBadgeTipo(plan.tipo);
        
        item.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div class="flex-grow-1">
                    <h6 class="mb-1">${plan.nombrePlan}</h6>
                    <small class="d-block text-muted">${plan.nombreEstudiante}</small>
                    <div class="mt-2">
                        <span class="badge bg-primary">${tipoBadge}</span>
                        <span class="badge ${estadoBadge}">${plan.estado}</span>
                    </div>
                </div>
            </div>
        `;
        
        item.addEventListener("click", () => cargarDetallesPlan(plan.id));
        listaPlanes.appendChild(item);
    });
}

function mostrarMensajeListaVacia() {
    const listaPlanes = document.getElementById("listaPlanes");
    listaPlanes.innerHTML = `
        <div class="text-center text-muted">
            <i class="bi bi-inbox display-1"></i>
            <p class="small mb-0">No hay planes disponibles</p>
        </div>
    `;
}

// ==========================================
// CARGAR DETALLES DEL PLAN
// ==========================================

async function cargarDetallesPlan(planId) {
    try {
        console.log("📋 Cargando detalles del plan:", planId);
        
        planActual = await obtenerPlanPorIdServicio(planId);
        
        // Mostrar sección detalle y ocultar bienvenida
        document.getElementById("seccionBienvenida").style.display = "none";
        document.getElementById("detallePlan").style.display = "block";
        
        // Llenar encabezado
        document.getElementById("nombrePlanHeader").textContent = planActual.nombrePlan;
        document.getElementById("estudiantePlanHeader").textContent = `${planActual.nombreEstudiante} • ${planActual.tipo}`;
        
        // Llenar información general
        document.getElementById("tipoDigrafia").innerHTML = `<span class="badge ${obtenerClaseBadgeTipo(planActual.tipo)}">${obtenerNombreTipo(planActual.tipo)}</span>`;
        document.getElementById("estadoPlan").innerHTML = `<span class="badge ${obtenerClaseBadgeEstado(planActual.estado)}">${planActual.estado}</span>`;
        document.getElementById("fechaInicioPlan").textContent = new Date(planActual.fechaInicio).toLocaleDateString("es-ES");
        document.getElementById("fechaTerminoPlan").textContent = planActual.fechaTermino 
            ? new Date(planActual.fechaTermino).toLocaleDateString("es-ES")
            : "No definida";
        document.getElementById("descripcionPlan").textContent = planActual.descripcion || "";
        
        // Cargar secciones
        await cargarObjetivos();
        await cargarActividades();
        await cargarSeguimiento();
        await cargarProgreso();
        
        // Cargar notas
        document.getElementById("notasPlan").value = planActual.notas || "";
        
        console.log("✅ Detalles cargados");
    } catch (error) {
        console.error("❌ Error cargando detalles:", error);
        mostrarNotificacion("Error al cargar el plan", "danger");
    }
}

// ==========================================
// CARGAR OBJETIVOS
// ==========================================

async function cargarObjetivos() {
    const listaObjetivos = document.getElementById("listaObjetivos");
    const objetivos = planActual.objetivos || [];
    
    if (objetivos.length === 0) {
        listaObjetivos.innerHTML = `
            <div class="alert alert-info mb-0">
                <i class="bi bi-info-circle"></i> No hay objetivos definidos
            </div>
        `;
        return;
    }
    
    listaObjetivos.innerHTML = "";
    
    objetivos.forEach(objetivo => {
        const card = document.createElement("div");
        card.className = "card border-start border-info";
        card.innerHTML = `
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <h6 class="card-title text-info">${objetivo.descripcion}</h6>
                        ${objetivo.metrica ? `<small class="text-muted"><strong>Métrica:</strong> ${objetivo.metrica}</small>` : ""}
                    </div>
                    <button class="btn btn-sm btn-danger" onclick="eliminarObjetivo('${objetivo.id}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        `;
        listaObjetivos.appendChild(card);
    });
}

// ==========================================
// CARGAR ACTIVIDADES
// ==========================================

async function cargarActividades() {
    const listaActividades = document.getElementById("listaActividades");
    const actividades = planActual.actividades || [];
    
    if (actividades.length === 0) {
        listaActividades.innerHTML = `
            <div class="alert alert-warning mb-0">
                <i class="bi bi-info-circle"></i> No hay actividades definidas
            </div>
        `;
        return;
    }
    
    listaActividades.innerHTML = "";
    
    actividades.forEach((actividad, index) => {
        const card = document.createElement("div");
        card.className = "card actividad-item";
        card.draggable = true;
        
        const estadoCheckbox = actividad.completado 
            ? "checked" 
            : "";
        
        card.innerHTML = `
            <div class="card-body">
                <div class="d-flex gap-3">
                    <div class="flex-grow-1">
                        <div class="d-flex align-items-center gap-2 mb-2">
                            <i class="bi bi-grip-vertical text-muted"></i>
                            <input type="checkbox" class="form-check-input" ${estadoCheckbox} 
                                onchange="marcarActividadCompletada('${actividad.id}', this.checked)">
                            <h6 class="mb-0 ${actividad.completado ? 'text-decoration-line-through text-muted' : ''}">${actividad.nombre}</h6>
                        </div>
                        <small class="d-block text-muted mb-2">${actividad.descripcion || ""}</small>
                        <div class="d-flex gap-2 flex-wrap">
                            <span class="badge bg-info"><i class="bi bi-hourglass-split"></i> ${actividad.duracion} min</span>
                            <span class="badge bg-secondary">${obtenerNombreFrecuencia(actividad.frecuencia)}</span>
                        </div>
                    </div>
                    <div>
                        <button class="btn btn-sm btn-danger" onclick="eliminarActividad('${actividad.id}')">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        listaActividades.appendChild(card);
    });
}

// ==========================================
// CARGAR SEGUIMIENTO
// ==========================================

async function cargarSeguimiento() {
    try {
        const registros = await obtenerRegistroSeguimientoServicio(planActual.id);
        const estadisticas = await obtenerEstadísticasServicio(planActual.id);
        
        // Actualizar estadísticas
        document.getElementById("totalObjetivos").textContent = estadisticas.totalObjetivos;
        document.getElementById("totalActividades").textContent = estadisticas.totalActividades;
        document.getElementById("actividadesCompletadas").textContent = estadisticas.actividadesCompletadas;
        document.getElementById("actividadesPendientes").textContent = estadisticas.actividadesPendientes;
        
        // Mostrar registros
        const listaRegistros = document.getElementById("listaRegistroSeguimiento");
        
        if (registros.length === 0) {
            listaRegistros.innerHTML = `
                <div class="alert alert-info mb-0">
                    <i class="bi bi-info-circle"></i> No hay registros de seguimiento
                </div>
            `;
            return;
        }
        
        listaRegistros.innerHTML = "";
        
        registros.forEach(registro => {
            const alert = document.createElement("div");
            alert.className = "alert alert-light border-start border-info";
            alert.innerHTML = `
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <h6 class="alert-heading mb-2">
                            <i class="bi bi-calendar-event"></i>
                            ${new Date(registro.fecha).toLocaleDateString("es-ES")}
                        </h6>
                        <p class="mb-0">${registro.nota}</p>
                        <small class="text-muted">${registro.usuario}</small>
                    </div>
                </div>
            `;
            listaRegistros.appendChild(alert);
        });
    } catch (error) {
        console.error("❌ Error cargando seguimiento:", error);
    }
}

// ==========================================
// CARGAR PROGRESO
// ==========================================

async function cargarProgreso() {
    try {
        const progreso = await calcularProgresoServicio(planActual.id);
        
        const barraProgreso = document.getElementById("barraProgreso");
        const textoProgreso = document.getElementById("textoProgreso");
        
        barraProgreso.style.width = progreso.porcentaje + "%";
        textoProgreso.textContent = progreso.porcentaje + "%";
        
        // Cambiar color según progreso
        barraProgreso.classList.remove("bg-success", "bg-warning", "bg-danger");
        
        if (progreso.porcentaje === 100) {
            barraProgreso.classList.add("bg-success");
        } else if (progreso.porcentaje >= 50) {
            barraProgreso.classList.add("bg-success");
        } else if (progreso.porcentaje >= 25) {
            barraProgreso.classList.add("bg-warning");
        } else {
            barraProgreso.classList.add("bg-danger");
        }
    } catch (error) {
        console.error("❌ Error calculando progreso:", error);
    }
}

// ==========================================
// CREAR/ACTUALIZAR PLAN
// ==========================================

function abrirModalNuevoPlan() {
    document.getElementById("tituloPlanModal").textContent = 
        "🆕 Nuevo Plan de Intervención";
    document.getElementById("formPlan").reset();
    document.getElementById("fechaInicio").value = new Date().toISOString().split("T")[0];
    document.getElementById("btnGuardarPlan").textContent = "✅ Crear Plan";
    planActual = null;
    modalPlan.show();
}

function editarPlanActual() {
    if (!planActual) return;
    
    document.getElementById("tituloPlanModal").textContent = "✏️ Editar Plan";
    document.getElementById("nombrePlan").value = planActual.nombrePlan;
    document.getElementById("nombreEstudiante").value = planActual.nombreEstudiante;
    document.getElementById("tipoPlan").value = planActual.tipo;
    document.getElementById("estadoPlan").value = planActual.estado;
    document.getElementById("fechaInicio").value = planActual.fechaInicio;
    document.getElementById("fechaTermino").value = planActual.fechaTermino || "";
    document.getElementById("descripcion").value = planActual.descripcion || "";
    document.getElementById("btnGuardarPlan").textContent = "💾 Actualizar";
    
    modalPlan.show();
}

async function guardarPlan() {
    try {
        const nombrePlan = document.getElementById("nombrePlan").value.trim();
        const nombreEstudiante = document.getElementById("nombreEstudiante").value.trim();
        const tipoPlan = document.getElementById("tipoPlan").value;
        const estadoPlan = document.getElementById("estadoPlan").value;
        const fechaInicio = document.getElementById("fechaInicio").value;
        const fechaTermino = document.getElementById("fechaTermino").value;
        const descripcion = document.getElementById("descripcion").value;
        
        if (!nombrePlan || !nombreEstudiante || !tipoPlan || !fechaInicio) {
            mostrarNotificacion("Por favor completa los campos obligatorios", "warning");
            return;
        }
        
        if (planActual) {
            // Actualizar
            planActual.nombrePlan = nombrePlan;
            planActual.nombreEstudiante = nombreEstudiante;
            planActual.tipo = tipoPlan;
            planActual.estado = estadoPlan;
            planActual.fechaInicio = fechaInicio;
            planActual.fechaTermino = fechaTermino;
            planActual.descripcion = descripcion;
            
            await actualizarPlanServicio(planActual);
            mostrarNotificacion("✅ Plan actualizado correctamente", "success");
        } else {
            // Crear
            const nuevoPlan = await crearPlanServicio({
                nombrePlan,
                nombreEstudiante,
                tipo: tipoPlan,
                estado: estadoPlan,
                fechaInicio,
                fechaTermino,
                descripcion,
                objetivos: [],
                actividades: [],
                registroSeguimiento: []
            });
            
            planActual = nuevoPlan;
            mostrarNotificacion("✅ Plan creado correctamente", "success");
        }
        
        modalPlan.hide();
        await cargarPlanes();
        await cargarDetallesPlan(planActual.id);
    } catch (error) {
        console.error("❌ Error guardando plan:", error);
        mostrarNotificacion("Error al guardar el plan", "danger");
    }
}

// ==========================================
// OBJETIVOS
// ==========================================

function abrirModalObjetivo() {
    if (!planActual) {
        mostrarNotificacion("Primero debes seleccionar un plan", "warning");
        return;
    }
    document.getElementById("formObjetivo").reset();
    modalObjetivo.show();
}

async function guardarObjetivo() {
    try {
        const descripcion = document.getElementById("descripcionObjetivo").value.trim();
        const metrica = document.getElementById("metricaObjetivo").value.trim();
        
        if (!descripcion) {
            mostrarNotificacion("Ingresa la descripción del objetivo", "warning");
            return;
        }
        
        await agregarObjetivoServicio(planActual.id, {
            descripcion,
            metrica
        });
        
        mostrarNotificacion("✅ Objetivo agregado", "success");
        modalObjetivo.hide();
        planActual = await obtenerPlanPorIdServicio(planActual.id);
        await cargarObjetivos();
    } catch (error) {
        console.error("❌ Error guardando objetivo:", error);
        mostrarNotificacion("Error al agregar objetivo", "danger");
    }
}

async function eliminarObjetivo(objetivoId) {
    if (!confirm("¿Estás seguro de que quieres eliminar este objetivo?")) return;
    
    try {
        await eliminarObjetivoServicio(planActual.id, objetivoId);
        mostrarNotificacion("✅ Objetivo eliminado", "success");
        planActual = await obtenerPlanPorIdServicio(planActual.id);
        await cargarObjetivos();
    } catch (error) {
        console.error("❌ Error eliminando objetivo:", error);
        mostrarNotificacion("Error al eliminar objetivo", "danger");
    }
}

// ==========================================
// ACTIVIDADES
// ==========================================

function abrirModalActividad() {
    if (!planActual) {
        mostrarNotificacion("Primero debes seleccionar un plan", "warning");
        return;
    }
    document.getElementById("formActividad").reset();
    modalActividad.show();
}

async function guardarActividad() {
    try {
        const nombre = document.getElementById("nombreActividad").value.trim();
        const descripcion = document.getElementById("descripcionActividad").value.trim();
        const frecuencia = document.getElementById("frecuenciaActividad").value;
        const duracion = parseInt(document.getElementById("duracionActividad").value);
        
        if (!nombre || !frecuencia || !duracion) {
            mostrarNotificacion("Completa los campos obligatorios", "warning");
            return;
        }
        
        await agregarActividadServicio(planActual.id, {
            nombre,
            descripcion,
            frecuencia,
            duracion
        });
        
        mostrarNotificacion("✅ Actividad agregada", "success");
        modalActividad.hide();
        planActual = await obtenerPlanPorIdServicio(planActual.id);
        await cargarActividades();
        await cargarProgreso();
    } catch (error) {
        console.error("❌ Error guardando actividad:", error);
        mostrarNotificacion("Error al agregar actividad", "danger");
    }
}

async function marcarActividadCompletada(actividadId, completado) {
    try {
        await marcarActividadCompletadaServicio(planActual.id, actividadId, completado);
        planActual = await obtenerPlanPorIdServicio(planActual.id);
        await cargarActividades();
        await cargarProgreso();
        await cargarSeguimiento();
    } catch (error) {
        console.error("❌ Error marcando actividad:", error);
        mostrarNotificacion("Error al actualizar actividad", "danger");
    }
}

async function eliminarActividad(actividadId) {
    if (!confirm("¿Eliminar esta actividad?")) return;
    
    try {
        await eliminarActividadServicio(planActual.id, actividadId);
        mostrarNotificacion("✅ Actividad eliminada", "success");
        planActual = await obtenerPlanPorIdServicio(planActual.id);
        await cargarActividades();
        await cargarProgreso();
    } catch (error) {
        console.error("❌ Error eliminando actividad:", error);
        mostrarNotificacion("Error al eliminar actividad", "danger");
    }
}

// ==========================================
// SEGUIMIENTO
// ==========================================

function abrirModalRegistro() {
    if (!planActual) {
        mostrarNotificacion("Primero debes seleccionar un plan", "warning");
        return;
    }
    document.getElementById("formRegistro").reset();
    document.getElementById("fechaRegistroActual").textContent = new Date().toLocaleString("es-ES");
    modalRegistro.show();
}

async function guardarRegistro() {
    try {
        const nota = document.getElementById("notaRegistro").value.trim();
        
        if (!nota) {
            mostrarNotificacion("Escribe una nota de seguimiento", "warning");
            return;
        }
        
        await agregarRegistroSeguimientoServicio(planActual.id, nota);
        mostrarNotificacion("✅ Registro guardado", "success");
        modalRegistro.hide();
        planActual = await obtenerPlanPorIdServicio(planActual.id);
        await cargarSeguimiento();
    } catch (error) {
        console.error("❌ Error guardando registro:", error);
        mostrarNotificacion("Error al guardar registro", "danger");
    }
}

// ==========================================
// NOTAS
// ==========================================

async function guardarNotas() {
    try {
        const notas = document.getElementById("notasPlan").value;
        planActual.notas = notas;
        await actualizarPlanServicio(planActual);
        mostrarNotificacion("✅ Notas guardadas", "success");
    } catch (error) {
        console.error("❌ Error guardando notas:", error);
        mostrarNotificacion("Error al guardar notas", "danger");
    }
}

// ==========================================
// ACCIONES DEL PLAN
// ==========================================

async function duplicarPlanActual() {
    if (!planActual) return;
    
    try {
        const nuevoNombre = `${planActual.nombrePlan} (Copia)`;
        await duplicarPlanServicio(planActual.id, nuevoNombre);
        mostrarNotificacion("✅ Plan duplicado", "success");
        await cargarPlanes();
    } catch (error) {
        console.error("❌ Error duplicando plan:", error);
        mostrarNotificacion("Error al duplicar plan", "danger");
    }
}

async function exportarPlanActual() {
    if (!planActual) return;
    
    try {
        await exportarPlanJSONServicio(planActual.id);
        mostrarNotificacion("✅ Plan exportado", "success");
    } catch (error) {
        console.error("❌ Error exportando plan:", error);
        mostrarNotificacion("Error al exportar plan", "danger");
    }
}

async function eliminarPlanActual() {
    if (!planActual) return;
    
    if (!confirm("¿Estás seguro de que quieres eliminar este plan? Esta acción no se puede deshacer.")) {
        return;
    }
    
    try {
        await eliminarPlanServicio(planActual.id);
        mostrarNotificacion("✅ Plan eliminado", "success");
        planActual = null;
        document.getElementById("seccionBienvenida").style.display = "block";
        document.getElementById("detallePlan").style.display = "none";
        await cargarPlanes();
    } catch (error) {
        console.error("❌ Error eliminando plan:", error);
        mostrarNotificacion("Error al eliminar plan", "danger");
    }
}

// ==========================================
// FILTROS Y BÚSQUEDA
// ==========================================

async function filtrarPlanes() {
    const estado = document.getElementById("filtroEstado").value;
    
    if (!estado) {
        mostrarListaPlanes(planes);
        return;
    }
    
    const filtrados = planes.filter(p => p.estado === estado);
    mostrarListaPlanes(filtrados);
}

function abrirImportador() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            const contenido = await file.text();
            const nuevoPlan = await importarPlanJSONServicio(contenido);
            mostrarNotificacion("✅ Plan importado", "success");
            await cargarPlanes();
            await cargarDetallesPlan(nuevoPlan.id);
        } catch (error) {
            console.error("❌ Error importando plan:", error);
            mostrarNotificacion("Error al importar plan", "danger");
        }
    };
    input.click();
}

// ==========================================
// UTILIDADES
// ==========================================

function obtenerBadgeEstado(estado) {
    const map = {
        "activo": "bg-success",
        "pausado": "bg-warning",
        "completado": "bg-info"
    };
    return map[estado] || "bg-secondary";
}

function obtenerClaseBadgeEstado(estado) {
    return obtenerBadgeEstado(estado);
}

function obtenerBadgeTipo(tipo) {
    const map = {
        "motriz": "Motriz",
        "espacial": "Espacial",
        "dislexica": "Dislexica",
        "fonologica": "Fonológica"
    };
    return map[tipo] || tipo;
}

function obtenerNombreTipo(tipo) {
    const map = {
        "motriz": "Disgrafia Motriz",
        "espacial": "Disgrafia Espacial",
        "dislexica": "Disgrafia Dislexica",
        "fonologica": "Disgrafia Fonológica"
    };
    return map[tipo] || tipo;
}

function obtenerClaseBadgeTipo(tipo) {
    const map = {
        "motriz": "bg-motriz",
        "espacial": "bg-espacial",
        "dislexica": "bg-dislexica",
        "fonologica": "bg-fonologica"
    };
    return map[tipo] || "bg-secondary";
}

function obtenerNombreFrecuencia(frecuencia) {
    const map = {
        "diaria": "Diaria",
        "3_veces_semana": "3x/semana",
        "semanal": "Semanal",
        "quincenal": "Quincenal"
    };
    return map[frecuencia] || frecuencia;
}

function mostrarNotificacion(mensaje, tipo = "info") {
    const toastBody = document.getElementById("toastMensaje");
    toastBody.textContent = mensaje;
    toastBody.parentElement.className = `toast-body bg-${tipo} text-white`;
    toastNotificacion.show();
}

// Exportar funciones para que sean accesibles desde HTML
window.cargarDetallesPlan = cargarDetallesPlan;
window.eliminarObjetivo = eliminarObjetivo;
window.marcarActividadCompletada = marcarActividadCompletada;
window.eliminarActividad = eliminarActividad;
