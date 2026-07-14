import {
    crearPlanServicio,
    obtenerPlanesServicio,
    actualizarPlanServicio,
    eliminarPlanServicio,
    agregarActividadServicio,
    actualizarActividadServicio,
    eliminarActividadServicio,
    agregarObjetivoServicio,
    eliminarObjetivoServicio,
    calcularProgresoServicio
} from "./planes-service.js";

// Estado global
const estado = {
    planActual: null,
    planes: [],
    diagnosticos: [],
    estudiantes: [],
    filtros: {
        estado: "",
        tipo: ""
    }
};

// Elementos del DOM
const elementos = {
    indicadorCarga: document.getElementById("indicadorCarga"),
    seccionBienvenida: document.getElementById("seccionBienvenida"),
    listaPlanes: document.getElementById("listaPlanes"),
    detallePlan: document.getElementById("detallePlan"),
    btnNuevoPlan: document.getElementById("btnNuevoPlan"),
    btnIniciarPlan: document.getElementById("btnIniciarPlan"),
    btnTema: document.getElementById("btnTema"),
    filtroEstado: document.getElementById("filtroEstado"),
    filtroTipo: document.getElementById("filtroTipo"),
    modalPlan: new bootstrap.Modal(document.getElementById("modalPlan")),
    modalObjetivo: new bootstrap.Modal(document.getElementById("modalObjetivo")),
    modalActividad: new bootstrap.Modal(document.getElementById("modalActividad")),
    toastNotificacion: document.getElementById("toastNotificacion"),
    toastMensaje: document.getElementById("toastMensaje")
};

// Inicialización
document.addEventListener("DOMContentLoaded", () => {
    console.log("🚀 Inicializando Planes de Intervención...");
    
    try {
        inicializarTema();
        cargarDatos();
        configurarEventListeners();
    } catch (error) {
        console.error("❌ Error inicializando:", error);
        mostrarNotificacion("Error al inicializar", "danger");
    }
});

// ==========================================
// CARGA DE DATOS
// ==========================================

async function cargarDatos() {
    try {
        elementos.indicadorCarga.style.display = "block";
        
        // Cargar planes
        estado.planes = await obtenerPlanesServicio();
        
        // Cargar diagnósticos y estudiantes (si aplica)
        await cargarEstudiantes();
        
        // Renderizar UI
        renderizarListaPlanes();
        
        if (estado.planes.length === 0) {
            mostrarBienvenida();
        } else {
            seleccionarPrimer Plan();
        }
        
        elementos.indicadorCarga.style.display = "none";
        
    } catch (error) {
        console.error("Error cargando datos:", error);
        mostrarNotificacion("Error al cargar planes", "danger");
        elementos.indicadorCarga.style.display = "none";
    }
}

async function cargarEstudiantes() {
    // TODO: Conectar con servicio de estudiantes
    // Por ahora se cargan placeholders
    estado.estudiantes = [
        { id: "1", nombre: "Juan Pérez" },
        { id: "2", nombre: "María García" },
        { id: "3", nombre: "Carlos López" }
    ];
}

// ==========================================
// RENDERIZADO
// ==========================================

function renderizarListaPlanes() {
    const listaHTML = estado.planes
        .filter(plan => aplicarFiltros(plan))
        .map((plan, index) => `
            <button class="list-group-item list-group-item-action text-start ${plan.id === estado.planActual?.id ? 'active' : ''}" 
                    onclick="seleccionarPlan('${plan.id}')" 
                    data-plan-id="${plan.id}">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="mb-1">${plan.nombrePlan}</h6>
                        <small class="text-muted">${plan.nombreEstudiante}</small>
                    </div>
                    <span class="badge bg-${getColorEstado(plan.estado)}">${plan.estado}</span>
                </div>
            </button>
        `)
        .join("");
    
    elementos.listaPlanes.innerHTML = listaHTML || '<p class="p-3 text-muted">Sin planes</p>';
}

function aplicarFiltros(plan) {
    if (estado.filtros.estado && plan.estado !== estado.filtros.estado) return false;
    if (estado.filtros.tipo && plan.tipo !== estado.filtros.tipo) return false;
    return true;
}

function getColorEstado(estado) {
    const colores = {
        "activo": "success",
        "pausado": "warning",
        "completado": "secondary"
    };
    return colores[estado] || "primary";
}

function mostrarBienvenida() {
    elementos.seccionBienvenida.style.display = "block";
    elementos.detallePlan.style.display = "none";
}

function seleccionarPlan(planId) {
    const plan = estado.planes.find(p => p.id === planId);
    if (plan) {
        estado.planActual = plan;
        elementos.seccionBienvenida.style.display = "none";
        elementos.detallePlan.style.display = "block";
        renderizarDetallePlan();
        renderizarListaPlanes();
    }
}

function seleccionarPrimerPlan() {
    if (estado.planes.length > 0) {
        seleccionarPlan(estado.planes[0].id);
    }
}

function renderizarDetallePlan() {
    if (!estado.planActual) return;
    
    const plan = estado.planActual;
    
    // Información general
    document.getElementById("nombrePlan").textContent = plan.nombrePlan;
    document.getElementById("estudiantePlan").textContent = plan.nombreEstudiante;
    document.getElementById("tipoPlan").textContent = plan.tipo.toUpperCase();
    document.getElementById("tipoPlan").className = `badge bg-${plan.tipo === "motriz" ? "primary" : "info"}`;
    document.getElementById("estadoPlan").textContent = plan.estado.toUpperCase();
    document.getElementById("estadoPlan").className = `badge bg-${getColorEstado(plan.estado)}`;
    document.getElementById("descripcionPlan").value = plan.descripcion;
    
    // Fechas
    const fechasFormato = `${new Date(plan.fechaInicio).toLocaleDateString("es-EC")} - ${new Date(plan.fechaTermino).toLocaleDateString("es-EC")}`;
    document.getElementById("fechasPlan").textContent = fechasFormato;
    
    // Objetivos
    renderizarObjetivos(plan.objetivos || []);
    
    // Actividades
    renderizarActividades(plan.actividades || []);
    
    // Seguimiento
    renderizarSeguimiento(plan);
    
    // Notas
    document.getElementById("notasPlan").value = plan.notas || "";
}

function renderizarObjetivos(objetivos) {
    const html = objetivos.map((obj, index) => `
        <div class="card mb-2">
            <div class="card-body p-3">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <h6 class="mb-1">${obj.descripcion}</h6>
                        <small class="text-muted">
                            <strong>Indicador:</strong> ${obj.indicador}
                        </small>
                    </div>
                    <button class="btn btn-sm btn-danger" onclick="eliminarObjetivo('${obj.id}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join("");
    
    document.getElementById("listaObjetivos").innerHTML = html || '<p class="text-muted">Sin objetivos</p>';
}

function renderizarActividades(actividades) {
    const html = actividades.map((act, index) => `
        <div class="card mb-2 actividad-item" draggable="true" data-actividad-id="${act.id}">
            <div class="card-body p-3">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <div class="d-flex align-items-center gap-2 mb-1">
                            <i class="bi bi-grip-vertical text-muted"></i>
                            <h6 class="mb-0">${act.nombre}</h6>
                            <span class="badge bg-secondary">${act.frecuencia}</span>
                        </div>
                        <p class="mb-1 text-muted small">${act.descripcion}</p>
                        <small class="text-muted">
                            <i class="bi bi-clock"></i> ${act.duracion} min |
                            <i class="bi bi-box"></i> Materiales: ${act.materiales || "N/A"}
                        </small>
                    </div>
                    <button class="btn btn-sm btn-danger" onclick="eliminarActividad('${act.id}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join("");
    
    const elemento = document.getElementById("listaActividades");
    elemento.innerHTML = html || '<p class="text-muted">Sin actividades</p>';
    
    // Inicializar drag & drop
    if (actividades.length > 0) {
        inicializarDragDrop();
    }
}

function renderizarSeguimiento(plan) {
    // Calcular progreso
    const totalActividades = (plan.actividades || []).length;
    const actividadesCompletadas = (plan.actividades || []).filter(a => a.completado).length;
    const porcentaje = totalActividades > 0 ? Math.round((actividadesCompletadas / totalActividades) * 100) : 0;
    
    // Actualizar barra
    const barraProgreso = document.getElementById("barraProgresoPlan");
    barraProgreso.style.width = porcentaje + "%";
    document.getElementById("porcentajeProgreso").textContent = porcentaje;
    
    // Estadísticas
    const estadisticas = `
        <div class="text-end">
            <p class="mb-1"><strong>${actividadesCompletadas}/${totalActividades}</strong> actividades completadas</p>
            <small class="text-muted">Progreso: ${porcentaje}%</small>
        </div>
    `;
    document.getElementById("estadisticasActividades").innerHTML = estadisticas;
    
    // Registro de seguimiento
    const registro = (plan.registroSeguimiento || [])
        .map(reg => `
            <div class="alert alert-light border-start border-info mb-2">
                <strong>${new Date(reg.fecha).toLocaleDateString("es-EC")}:</strong> ${reg.nota}
            </div>
        `)
        .join("");
    
    document.getElementById("registroSeguimiento").innerHTML = registro || '<p class="text-muted">Sin registros</p>';
}

// ==========================================
// DRAG & DROP
// ==========================================

function inicializarDragDrop() {
    const lista = document.getElementById("listaActividades");
    
    if (!lista) return;
    
    const items = lista.querySelectorAll(".actividad-item");
    
    items.forEach(item => {
        item.addEventListener("dragstart", (e) => {
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/html", item.innerHTML);
            item.classList.add("dragging");
        });
        
        item.addEventListener("dragend", () => {
            item.classList.remove("dragging");
        });
        
        item.addEventListener("dragover", (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            const dragging = lista.querySelector(".dragging");
            if (dragging && item !== dragging) {
                item.parentNode.insertBefore(dragging, item);
            }
        });
    });
    
    lista.addEventListener("drop", (e) => {
        e.preventDefault();
        guardarOrdenActividades();
    });
}

async function guardarOrdenActividades() {
    if (!estado.planActual) return;
    
    const items = document.querySelectorAll(".actividad-item");
    const nuevoOrden = Array.from(items).map(item => item.dataset.actividadId);
    
    try {
        estado.planActual.ordenActividades = nuevoOrden;
        await actualizarPlanServicio(estado.planActual);
        mostrarNotificacion("Orden de actividades actualizado", "success");
    } catch (error) {
        console.error("Error al guardar orden:", error);
        mostrarNotificacion("Error al guardar orden", "danger");
    }
}

// ==========================================
// CREAR/EDITAR PLAN
// ==========================================

async function crearNuevoPlan() {
    document.getElementById("tituloModalPlan").textContent = "Nuevo Plan de Intervención";
    document.getElementById("formularioPlan").reset();
    
    // Cargar estudiantes en select
    const select = document.getElementById("estudianteModal");
    select.innerHTML = '<option value="">Selecciona estudiante...</option>' + 
        estado.estudiantes.map(e => `<option value="${e.id}">${e.nombre}</option>`).join("");
    
    elementos.modalPlan.show();
}

async function guardarPlan() {
    const formulario = document.getElementById("formularioPlan");
    
    if (!formulario.checkValidity()) {
        formulario.reportValidity();
        return;
    }
    
    try {
        const planData = {
            nombrePlan: document.getElementById("nombrePlanModal").value,
            nombreEstudiante: document.getElementById("estudianteModal").selectedOptions[0].text,
            tipo: document.getElementById("tipoModal").value,
            fechaInicio: document.getElementById("fechaInicioModal").value,
            fechaTermino: document.getElementById("fechaTerminoModal").value,
            descripcion: document.getElementById("descripcionModal").value,
            estado: document.getElementById("estadoModal").value,
            objetivos: [],
            actividades: [],
            notas: "",
            registroSeguimiento: [],
            createdAt: new Date().toISOString()
        };
        
        let plan;
        if (estado.planActual?.id) {
            // Editar
            plan = { ...estado.planActual, ...planData };
            await actualizarPlanServicio(plan);
            mostrarNotificacion("Plan actualizado exitosamente", "success");
        } else {
            // Crear
            plan = await crearPlanServicio(planData);
            estado.planes.push(plan);
            mostrarNotificacion("Plan creado exitosamente", "success");
        }
        
        estado.planActual = plan;
        elementos.modalPlan.hide();
        renderizarListaPlanes();
        renderizarDetallePlan();
        
    } catch (error) {
        console.error("Error guardando plan:", error);
        mostrarNotificacion("Error al guardar plan", "danger");
    }
}

// ==========================================
// OBJETIVOS
// ==========================================

async function agregarObjetivo() {
    if (!estado.planActual) {
        mostrarNotificacion("Selecciona un plan primero", "warning");
        return;
    }
    
    document.getElementById("formularioObjetivo").reset();
    elementos.modalObjetivo.show();
}

async function guardarObjetivo() {
    const formulario = document.getElementById("formularioObjetivo");
    
    if (!formulario.checkValidity()) {
        formulario.reportValidity();
        return;
    }
    
    try {
        const objetivo = {
            id: "obj_" + Date.now(),
            descripcion: document.getElementById("descripcionObjetivo").value,
            indicador: document.getElementById("indicadorObjetivo").value
        };
        
        if (!estado.planActual.objetivos) {
            estado.planActual.objetivos = [];
        }
        
        estado.planActual.objetivos.push(objetivo);
        await actualizarPlanServicio(estado.planActual);
        
        elementos.modalObjetivo.hide();
        renderizarObjetivos(estado.planActual.objetivos);
        mostrarNotificacion("Objetivo agregado exitosamente", "success");
        
    } catch (error) {
        console.error("Error al agregar objetivo:", error);
        mostrarNotificacion("Error al agregar objetivo", "danger");
    }
}

async function eliminarObjetivo(objetivoId) {
    if (!confirm("¿Eliminar este objetivo?")) return;
    
    try {
        estado.planActual.objetivos = estado.planActual.objetivos.filter(o => o.id !== objetivoId);
        await actualizarPlanServicio(estado.planActual);
        renderizarObjetivos(estado.planActual.objetivos);
        mostrarNotificacion("Objetivo eliminado", "info");
    } catch (error) {
        console.error("Error eliminando objetivo:", error);
        mostrarNotificacion("Error al eliminar objetivo", "danger");
    }
}

// ==========================================
// ACTIVIDADES
// ==========================================

async function agregarActividad() {
    if (!estado.planActual) {
        mostrarNotificacion("Selecciona un plan primero", "warning");
        return;
    }
    
    document.getElementById("formularioActividad").reset();
    
    // Cargar objetivos en select
    const selectObjetivos = document.getElementById("objetivoActividad");
    selectObjetivos.innerHTML = '<option value="">Sin vincular</option>' + 
        (estado.planActual.objetivos || [])
            .map(obj => `<option value="${obj.id}">${obj.descripcion}</option>`)
            .join("");
    
    elementos.modalActividad.show();
}

async function guardarActividad() {
    const formulario = document.getElementById("formularioActividad");
    
    if (!formulario.checkValidity()) {
        formulario.reportValidity();
        return;
    }
    
    try {
        const actividad = {
            id: "act_" + Date.now(),
            nombre: document.getElementById("nombreActividad").value,
            descripcion: document.getElementById("descripcionActividad").value,
            frecuencia: document.getElementById("frecuenciaActividad").value,
            duracion: parseInt(document.getElementById("duracionActividad").value),
            materiales: document.getElementById("materialesActividad").value,
            objetivoId: document.getElementById("objetivoActividad").value,
            completado: false,
            fechasCompletadas: []
        };
        
        if (!estado.planActual.actividades) {
            estado.planActual.actividades = [];
        }
        
        estado.planActual.actividades.push(actividad);
        await actualizarPlanServicio(estado.planActual);
        
        elementos.modalActividad.hide();
        renderizarActividades(estado.planActual.actividades);
        mostrarNotificacion("Actividad agregada exitosamente", "success");
        
    } catch (error) {
        console.error("Error al agregar actividad:", error);
        mostrarNotificacion("Error al agregar actividad", "danger");
    }
}

async function eliminarActividad(actividadId) {
    if (!confirm("¿Eliminar esta actividad?")) return;
    
    try {
        estado.planActual.actividades = estado.planActual.actividades.filter(a => a.id !== actividadId);
        await actualizarPlanServicio(estado.planActual);
        renderizarActividades(estado.planActual.actividades);
        mostrarNotificacion("Actividad eliminada", "info");
    } catch (error) {
        console.error("Error eliminando actividad:", error);
        mostrarNotificacion("Error al eliminar actividad", "danger");
    }
}

// ==========================================
// NOTAS Y SEGUIMIENTO
// ==========================================

async function guardarNotas() {
    if (!estado.planActual) return;
    
    try {
        const notas = document.getElementById("notasPlan").value;
        estado.planActual.notas = notas;
        
        // Agregar al registro de seguimiento
        if (!estado.planActual.registroSeguimiento) {
            estado.planActual.registroSeguimiento = [];
        }
        
        estado.planActual.registroSeguimiento.push({
            fecha: new Date().toISOString(),
            nota: notas
        });
        
        await actualizarPlanServicio(estado.planActual);
        mostrarNotificacion("Notas guardadas exitosamente", "success");
        renderizarSeguimiento(estado.planActual);
        
    } catch (error) {
        console.error("Error guardando notas:", error);
        mostrarNotificacion("Error al guardar notas", "danger");
    }
}

// ==========================================
// EXPORTAR Y ELIMINAR
// ==========================================

async function exportarPlanPDF() {
    if (!estado.planActual) return;
    
    const contenido = `
        PLAN DE INTERVENCIÓN
        =====================
        
        Plan: ${estado.planActual.nombrePlan}
        Estudiante: ${estado.planActual.nombreEstudiante}
        Tipo de Disgrafía: ${estado.planActual.tipo.toUpperCase()}
        Estado: ${estado.planActual.estado}
        
        Fechas: ${new Date(estado.planActual.fechaInicio).toLocaleDateString("es-EC")} - ${new Date(estado.planActual.fechaTermino).toLocaleDateString("es-EC")}
        
        DESCRIPCIÓN
        -----------
        ${estado.planActual.descripcion}
        
        OBJETIVOS
        ---------
        ${(estado.planActual.objetivos || [])
            .map(obj => `• ${obj.descripcion}\n  Indicador: ${obj.indicador}`)
            .join("\n\n")}
        
        ACTIVIDADES
        -----------
        ${(estado.planActual.actividades || [])
            .map(act => `• ${act.nombre}\n  Descripción: ${act.descripcion}\n  Frecuencia: ${act.frecuencia}\n  Duración: ${act.duracion} minutos`)
            .join("\n\n")}
        
        NOTAS Y OBSERVACIONES
        --------------------
        ${estado.planActual.notas || "Sin notas"}
    `;
    
    const blob = new Blob([contenido], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Plan_${estado.planActual.nombrePlan.replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    mostrarNotificacion("Plan exportado exitosamente", "success");
}

async function eliminarPlan() {
    if (!estado.planActual) return;
    
    if (!confirm("¿Eliminar este plan? Esta acción no se puede deshacer.")) return;
    
    try {
        await eliminarPlanServicio(estado.planActual.id);
        estado.planes = estado.planes.filter(p => p.id !== estado.planActual.id);
        estado.planActual = null;
        
        renderizarListaPlanes();
        
        if (estado.planes.length === 0) {
            mostrarBienvenida();
        } else {
            seleccionarPrimerPlan();
        }
        
        mostrarNotificacion("Plan eliminado exitosamente", "success");
        
    } catch (error) {
        console.error("Error eliminando plan:", error);
        mostrarNotificacion("Error al eliminar plan", "danger");
    }
}

// ==========================================
// UTILIDADES
// ==========================================

function mostrarNotificacion(mensaje, tipo = "info") {
    elementos.toastMensaje.textContent = mensaje;
    elementos.toastNotificacion.className = `toast show bg-${tipo}`;
    
    const toast = new bootstrap.Toast(elementos.toastNotificacion);
    toast.show();
}

function inicializarTema() {
    const temaPref = localStorage.getItem("tema") || "light";
    const html = document.documentElement;
    
    if (temaPref === "dark") {
        html.setAttribute("data-bs-theme", "dark");
        elementos.btnTema.innerHTML = '<i class="bi bi-sun-fill"></i>';
    } else {
        html.setAttribute("data-bs-theme", "light");
        elementos.btnTema.innerHTML = '<i class="bi bi-moon-stars"></i>';
    }

    elementos.btnTema.addEventListener("click", () => {
        const temaActual = html.getAttribute("data-bs-theme") || "light";
        const temaNuevo = temaActual === "light" ? "dark" : "light";
        
        html.setAttribute("data-bs-theme", temaNuevo);
        localStorage.setItem("tema", temaNuevo);
        
        elementos.btnTema.innerHTML = temaNuevo === "light" 
            ? '<i class="bi bi-moon-stars"></i>' 
            : '<i class="bi bi-sun-fill"></i>';
    });
}

// ==========================================
// EVENT LISTENERS
// ==========================================

function configurarEventListeners() {
    elementos.btnNuevoPlan.addEventListener("click", crearNuevoPlan);
    elementos.btnIniciarPlan.addEventListener("click", crearNuevoPlan);
    
    document.getElementById("btnGuardarPlan").addEventListener("click", guardarPlan);
    document.getElementById("btnAgregarObjetivo").addEventListener("click", agregarObjetivo);
    document.getElementById("btnGuardarObjetivo").addEventListener("click", guardarObjetivo);
    document.getElementById("btnAgregarActividad").addEventListener("click", agregarActividad);
    document.getElementById("btnGuardarActividad").addEventListener("click", guardarActividad);
    document.getElementById("btnGuardarNotas").addEventListener("click", guardarNotas);
    document.getElementById("btnExportarPlan").addEventListener("click", exportarPlanPDF);
    document.getElementById("btnEditarPlan").addEventListener("click", crearNuevoPlan);
    document.getElementById("btnEliminarPlan").addEventListener("click", eliminarPlan);
    
    elementos.filtroEstado.addEventListener("change", (e) => {
        estado.filtros.estado = e.target.value;
        renderizarListaPlanes();
    });
    
    elementos.filtroTipo.addEventListener("change", (e) => {
        estado.filtros.tipo = e.target.value;
        renderizarListaPlanes();
    });
}

// Exportar funciones globales
window.seleccionarPlan = seleccionarPlan;
window.eliminarObjetivo = eliminarObjetivo;
window.eliminarActividad = eliminarActividad;
