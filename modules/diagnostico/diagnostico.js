import {
    crearDiagnosticoServicio,
    TIPOS_DISGRAFIA,
    obtenerInfoTipoDisgrafia,
    calcularNivelRiesgo,
    generarRecomendacionesInicialesServicio
} from "./diagnostico-service.js";

// Estado global del wizard
const estado = {
    pasoActual: 1,
    totalPasos: 10,
    datos: {
        nombreEstudiante: "",
        edadEstudiante: "",
        nivelEducativo: "",
        sintomasMotores: [],
        sintomasespaciales: [],
        sintomascConversion: [],
        sintomasFonologicos: [],
        severidad: "",
        intervencionPrevia: "",
        materialIntervension: "",
        otrosTrastornos: [],
        antecedentes: [],
        eventosSignificativos: "",
        observacionesAdicionales: "",
        derivacion: ""
    },
    diagnosticoGenerado: null
};

// Elementos del DOM
const elementos = {
    barraProgreso: document.getElementById("barraProgreso"),
    numeroPaso: document.getElementById("numeroPaso"),
    etapaActual: document.getElementById("etapaActual"),
    btnAnterior: document.getElementById("btnAnterior"),
    btnSiguiente: document.getElementById("btnSiguiente"),
    btnGuardar: document.getElementById("btnGuardar"),
    btnTema: document.getElementById("btnTema"),
    toastNotificacion: document.getElementById("toastNotificacion"),
    toastMensaje: document.getElementById("toastMensaje"),
    resumenResultados: document.getElementById("resumenResultados")
};

// Títulos de pasos
const titulosPasos = [
    "Información del Estudiante",
    "Síntomas Motores",
    "Síntomas Espaciales",
    "Conversión Letra-Sonido",
    "Síntomas Fonológicos",
    "Severidad Percibida",
    "Contexto Educativo",
    "Historial Familiar",
    "Información Adicional",
    "Resultados y Recomendaciones"
];

// Inicialización
document.addEventListener("DOMContentLoaded", () => {
    console.log("🚀 Inicializando Asistente de Diagnóstico...");
    
    try {
        inicializarTema();
        configurarEventListeners();
        mostrarPaso(1);
    } catch (error) {
        console.error("❌ Error inicializando:", error);
        mostrarNotificacion("Error al inicializar el asistente", "danger");
    }
});

// ==========================================
// FUNCIONES PRINCIPALES
// ==========================================

function mostrarPaso(numeroPaso) {
    // Validar paso actual
    if (!validarPasoActual()) {
        mostrarNotificacion("Por favor completa los campos requeridos", "warning");
        return;
    }

    // Guardar datos del paso actual
    guardarDatosPasoActual();

    // Ocultar todos los pasos
    document.querySelectorAll(".paso-wizard").forEach(paso => {
        paso.style.display = "none";
    });

    // Mostrar paso actual
    const pasoElement = document.getElementById(`paso${numeroPaso}`);
    if (pasoElement) {
        pasoElement.style.display = "block";
    }

    // Actualizar estado
    estado.pasoActual = numeroPaso;

    // Actualizar UI
    actualizarBarraProgreso();
    actualizarBotones();
    cargarDatosPaso();
    
    // Si es último paso, generar resultados
    if (numeroPaso === estado.totalPasos) {
        generarResultados();
    }

    // Scroll al inicio
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function validarPasoActual() {
    const paso = estado.pasoActual;

    switch (paso) {
        case 1:
            const nombre = document.getElementById("nombreEstudiante").value.trim();
            const edad = document.getElementById("edadEstudiante").value;
            const nivel = document.getElementById("nivelEducativo").value;
            return nombre && edad && nivel;

        case 6:
            return document.querySelector('input[name="severidad"]:checked') !== null;

        case 7:
            return document.querySelector('input[name="intervencionPrevia"]:checked') !== null;

        case 9:
            return document.querySelector('input[name="derivacion"]:checked') !== null;

        default:
            return true;
    }
}

function guardarDatosPasoActual() {
    const paso = estado.pasoActual;

    switch (paso) {
        case 1:
            estado.datos.nombreEstudiante = document.getElementById("nombreEstudiante").value;
            estado.datos.edadEstudiante = document.getElementById("edadEstudiante").value;
            estado.datos.nivelEducativo = document.getElementById("nivelEducativo").value;
            break;

        case 2:
            estado.datos.sintomasMotores = obtenerCheckboxesSeleccionados("motriz");
            break;

        case 3:
            estado.datos.sintomasespaciales = obtenerCheckboxesSeleccionados("espacial");
            break;

        case 4:
            estado.datos.sintomascConversion = obtenerCheckboxesSeleccionados("conversion");
            break;

        case 5:
            estado.datos.sintomasFonologicos = obtenerCheckboxesSeleccionados("fonologico");
            break;

        case 6:
            estado.datos.severidad = document.querySelector('input[name="severidad"]:checked')?.value || "";
            break;

        case 7:
            estado.datos.intervencionPrevia = document.querySelector('input[name="intervencionPrevia"]:checked')?.value || "";
            estado.datos.materialIntervension = document.getElementById("materialIntervension").value;
            estado.datos.otrosTrastornos = obtenerCheckboxesSeleccionados("otrosTrastornos");
            break;

        case 8:
            estado.datos.antecedentes = obtenerCheckboxesSeleccionados("antecedentes");
            break;

        case 9:
            estado.datos.eventosSignificativos = document.getElementById("eventosSignificativos").value;
            estado.datos.observacionesAdicionales = document.getElementById("observacionesAdicionales").value;
            estado.datos.derivacion = document.querySelector('input[name="derivacion"]:checked')?.value || "";
            break;
    }
}

function cargarDatosPaso() {
    const paso = estado.pasoActual;

    switch (paso) {
        case 1:
            document.getElementById("nombreEstudiante").value = estado.datos.nombreEstudiante;
            document.getElementById("edadEstudiante").value = estado.datos.edadEstudiante;
            document.getElementById("nivelEducativo").value = estado.datos.nivelEducativo;
            break;

        case 2:
            establecerCheckboxes("motriz", estado.datos.sintomasMotores);
            break;

        case 3:
            establecerCheckboxes("espacial", estado.datos.sintomasespaciales);
            break;

        case 4:
            establecerCheckboxes("conversion", estado.datos.sintomascConversion);
            break;

        case 5:
            establecerCheckboxes("fonologico", estado.datos.sintomasFonologicos);
            break;

        case 6:
            if (estado.datos.severidad) {
                document.getElementById(`severidad${estado.datos.severidad === "leve" ? "1" : estado.datos.severidad === "moderada" ? "2" : "3"}`).checked = true;
            }
            break;

        case 7:
            if (estado.datos.intervencionPrevia) {
                const id = estado.datos.intervencionPrevia === "si" ? "1" : estado.datos.intervencionPrevia === "no" ? "2" : "3";
                document.getElementById(`intervencion${id}`).checked = true;
            }
            document.getElementById("materialIntervension").value = estado.datos.materialIntervension;
            establecerCheckboxes("otrosTrastornos", estado.datos.otrosTrastornos);
            break;

        case 8:
            establecerCheckboxes("antecedentes", estado.datos.antecedentes);
            break;

        case 9:
            document.getElementById("eventosSignificativos").value = estado.datos.eventosSignificativos;
            document.getElementById("observacionesAdicionales").value = estado.datos.observacionesAdicionales;
            if (estado.datos.derivacion) {
                const id = estado.datos.derivacion === "si" ? "1" : estado.datos.derivacion === "puede_ser" ? "2" : "3";
                document.getElementById(`derivacion${id}`).checked = true;
            }
            break;
    }
}

function obtenerCheckboxesSeleccionados(name) {
    const checkboxes = document.querySelectorAll(`input[name="${name}"]:checked`);
    return Array.from(checkboxes).map(cb => cb.value);
}

function establecerCheckboxes(name, valores) {
    document.querySelectorAll(`input[name="${name}"]`).forEach(cb => {
        cb.checked = valores.includes(cb.value);
    });
}

function actualizarBarraProgreso() {
    const porcentaje = (estado.pasoActual / estado.totalPasos) * 100;
    elementos.barraProgreso.style.width = porcentaje + "%";
    elementos.numeroPaso.textContent = estado.pasoActual;
    elementos.etapaActual.textContent = titulosPasos[estado.pasoActual - 1];
}

function actualizarBotones() {
    // Botón anterior
    if (estado.pasoActual > 1) {
        elementos.btnAnterior.style.display = "inline-block";
    } else {
        elementos.btnAnterior.style.display = "none";
    }

    // Botón siguiente y guardar
    if (estado.pasoActual < estado.totalPasos) {
        elementos.btnSiguiente.style.display = "inline-block";
        elementos.btnGuardar.style.display = "none";
    } else {
        elementos.btnSiguiente.style.display = "none";
        elementos.btnGuardar.style.display = "inline-block";
    }
}

// ==========================================
// GENERACIÓN DE RESULTADOS
// ==========================================

function generarResultados() {
    // Calcular tipo de disgrafía predominante
    const tipoPredominate = calcularTipoPredominate();
    
    // Calcular porcentaje de indicadores
    const totalIndicadores = estado.datos.sintomasMotores.length +
                            estado.datos.sintomasespaciales.length +
                            estado.datos.sintomascConversion.length +
                            estado.datos.sintomasFonologicos.length;
    
    const nivelRiesgo = calcularNivelRiesgo(totalIndicadores);

    // Generar diagnóstico
    estado.diagnosticoGenerado = {
        estudianteId: null, // Se establece al guardar
        nombreEstudiante: estado.datos.nombreEstudiante,
        edad: estado.datos.edadEstudiante,
        nivel: estado.datos.nivelEducativo,
        tipo: tipoPredominate,
        caracteristicas: {
            motores: estado.datos.sintomasMotores,
            espaciales: estado.datos.sintomasespaciales,
            conversion: estado.datos.sintomascConversion,
            fonologicos: estado.datos.sintomasFonologicos
        },
        severidad: estado.datos.severidad,
        nivelRiesgo: nivelRiesgo,
        totalIndicadores: totalIndicadores,
        requiereDerivacion: estado.datos.derivacion === "si",
        intervencionPrevia: estado.datos.intervencionPrevia,
        antecedentes: estado.datos.antecedentes,
        observaciones: estado.datos.observacionesAdicionales
    };

    // Renderizar resultados
    renderizarResultados(estado.diagnosticoGenerado);
}

function calcularTipoPredominate() {
    const conteos = {
        motriz: estado.datos.sintomasMotores.length,
        espacial: estado.datos.sintomasespaciales.length,
        dislexica: estado.datos.sintomascConversion.length,
        fonologica: estado.datos.sintomasFonologicos.length
    };

    let tipo = "motriz";
    let maximo = 0;

    for (const [tipoKey, cantidad] of Object.entries(conteos)) {
        if (cantidad > maximo) {
            maximo = cantidad;
            tipo = tipoKey;
        }
    }

    return tipo;
}

function renderizarResultados(diagnostico) {
    const infoTipo = obtenerInfoTipoDisgrafia(diagnostico.tipo);
    
    let html = `
        <div class="resultado-container">
            <!-- Resumen Ejecutivo -->
            <div class="alert alert-info mb-4">
                <h5 class="alert-heading">
                    <i class="bi bi-info-circle"></i> Orientación Pedagógica
                </h5>
                <p class="mb-0">
                    Esta evaluación orienta al docente para identificar posibles dificultades. 
                    <strong>NO reemplaza la evaluación de un profesional especializado</strong> (psicólogo, psicopedagogo).
                </p>
            </div>

            <!-- Información del Estudiante -->
            <div class="card mb-3">
                <div class="card-header bg-primary text-white">
                    <h5 class="mb-0">Estudiante Evaluado</h5>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <p><strong>Nombre:</strong> ${diagnostico.nombreEstudiante}</p>
                            <p><strong>Edad:</strong> ${diagnostico.edad} años</p>
                        </div>
                        <div class="col-md-6">
                            <p><strong>Nivel Educativo:</strong> ${diagnostico.nivel}</p>
                            <p><strong>Fecha de Evaluación:</strong> ${new Date().toLocaleDateString("es-EC")}</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Resultados Principales -->
            <div class="card mb-3">
                <div class="card-header bg-success text-white">
                    <h5 class="mb-0">Resultados</h5>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <h6>Tipo de Disgrafía Predominante</h6>
                            <div class="alert alert-warning mb-0">
                                <h4 class="mb-1">${infoTipo.nombre}</h4>
                                <p class="mb-0">${infoTipo.descripcion}</p>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <h6>Nivel de Riesgo</h6>
                            <div class="alert alert-${diagnostico.nivelRiesgo === "alto" ? "danger" : diagnostico.nivelRiesgo === "medio" ? "warning" : "info"} mb-0">
                                <h4 class="mb-1 text-uppercase">${diagnostico.nivelRiesgo}</h4>
                                <p class="mb-0">Total de indicadores: ${diagnostico.totalIndicadores}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Síntomas Observados -->
            <div class="card mb-3">
                <div class="card-header bg-info text-white">
                    <h5 class="mb-0">Síntomas Observados</h5>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <h6>Síntomas Motores</h6>
                            <ul class="mb-3">
                                ${diagnostico.caracteristicas.motores.length > 0 
                                    ? diagnostico.caracteristicas.motores.map(s => `<li>${s}</li>`).join("") 
                                    : "<li class='text-muted'>Ninguno observado</li>"}
                            </ul>
                        </div>
                        <div class="col-md-6">
                            <h6>Síntomas Espaciales</h6>
                            <ul class="mb-3">
                                ${diagnostico.caracteristicas.espaciales.length > 0 
                                    ? diagnostico.caracteristicas.espaciales.map(s => `<li>${s}</li>`).join("") 
                                    : "<li class='text-muted'>Ninguno observado</li>"}
                            </ul>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <h6>Conversión Letra-Sonido</h6>
                            <ul class="mb-3">
                                ${diagnostico.caracteristicas.conversion.length > 0 
                                    ? diagnostico.caracteristicas.conversion.map(s => `<li>${s}</li>`).join("") 
                                    : "<li class='text-muted'>Ninguno observado</li>"}
                            </ul>
                        </div>
                        <div class="col-md-6">
                            <h6>Síntomas Fonológicos</h6>
                            <ul class="mb-3">
                                ${diagnostico.caracteristicas.fonologicos.length > 0 
                                    ? diagnostico.caracteristicas.fonologicos.map(s => `<li>${s}</li>`).join("") 
                                    : "<li class='text-muted'>Ninguno observado</li>"}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Recomendaciones -->
            <div class="card mb-3">
                <div class="card-header bg-warning text-dark">
                    <h5 class="mb-0">Recomendaciones Iniciales</h5>
                </div>
                <div class="card-body">
                    ${generarRecomendacionesHTML(infoTipo, diagnostico)}
                </div>
            </div>

            <!-- Derivación -->
            <div class="card">
                <div class="card-header ${diagnostico.requiereDerivacion ? "bg-danger" : "bg-success"} text-white">
                    <h5 class="mb-0">
                        ${diagnostico.requiereDerivacion 
                            ? '<i class="bi bi-exclamation-triangle"></i> Derivación Recomendada' 
                            : '<i class="bi bi-check-circle"></i> Seguimiento en Aula'}
                    </h5>
                </div>
                <div class="card-body">
                    ${diagnostico.requiereDerivacion 
                        ? `<p>Se recomienda derivación urgente a:</p>
                           <ul>
                               <li>Psicólogo Educativo</li>
                               <li>Psicopedagogo</li>
                               <li>Terapeuta Ocupacional</li>
                           </ul>
                           <p class="text-muted">Para evaluación profesional y diagnóstico clínico.</p>`
                        : `<p>Se puede trabajar en aula con:</p>
                           <ul>
                               <li>Estrategias multisensoriales</li>
                               <li>Adaptaciones didácticas</li>
                               <li>Ejercicios de motricidad fina</li>
                           </ul>
                           <p class="text-muted">Reevaluar en 4-6 semanas.</p>`}
                </div>
            </div>
        </div>
    `;

    elementos.resumenResultados.innerHTML = html;
}

function generarRecomendacionesHTML(infoTipo, diagnostico) {
    let html = `
        <h6 class="mb-3">Estrategias Recomendadas para ${infoTipo.nombre}:</h6>
        <ul class="mb-3">
    `;

    // Agregar características
    infoTipo.indicadores.forEach(indicador => {
        html += `<li>${indicador}</li>`;
    });

    html += `
        </ul>
        <h6 class="mb-2">Materiales y Recursos:</h6>
        <ul>
            <li>Papel pautado o con cuadrículas adaptadas</li>
            <li>Lápices ergonómicos</li>
            <li>Tabletas magnéticas para trazado</li>
            <li>Actividades de motricidad fina</li>
            <li>Consultá la Biblioteca de Recursos para más información</li>
        </ul>
    `;

    return html;
}

// ==========================================
// GUARDAR DIAGNÓSTICO
// ==========================================

async function guardarDiagnostico() {
    try {
        elementos.btnGuardar.disabled = true;
        elementos.btnGuardar.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Guardando...';

        // Validar que hay un diagnóstico generado
        if (!estado.diagnosticoGenerado) {
            mostrarNotificacion("Error: Diagnóstico no generado", "danger");
            return;
        }

        // Obtener estudiante actual (si está en contexto)
        const estudianteId = obtenerEstudianteActual();

        if (!estudianteId) {
            mostrarNotificacion("Se guardará como borrador. No hay estudiante seleccionado.", "warning");
        }

        // Crear datos para guardar
        const datosDiagnostico = {
            ...estado.diagnosticoGenerado,
            estudianteId: estudianteId,
            fecha: new Date().toISOString(),
            tipo: estado.diagnosticoGenerado.tipo
        };

        // Guardar en Firestore
        const diagnostico = await crearDiagnosticoServicio(datosDiagnostico);

        mostrarNotificacion("✅ Diagnóstico guardado exitosamente", "success");

        // Guardar ID para referencia
        estado.diagnosticoGenerado.id = diagnostico.id;

        // Mostrar opciones
        mostrarOpcionesPostGuardado(diagnostico);

        elementos.btnGuardar.disabled = false;
        elementos.btnGuardar.innerHTML = '<i class="bi bi-download"></i> Guardar Diagnóstico';

    } catch (error) {
        console.error("Error guardando diagnóstico:", error);
        mostrarNotificacion("Error al guardar el diagnóstico: " + error.message, "danger");
        
        elementos.btnGuardar.disabled = false;
        elementos.btnGuardar.innerHTML = '<i class="bi bi-download"></i> Guardar Diagnóstico';
    }
}

function obtenerEstudianteActual() {
    // TODO: Obtener del contexto de sesión o parámetro URL
    // Por ahora retorna null (se guarda como borrador)
    return null;
}

function mostrarOpcionesPostGuardado(diagnostico) {
    const opcionesHtml = `
        <div class="alert alert-success mt-4">
            <h5>¿Qué deseas hacer ahora?</h5>
            <div class="btn-group d-block" role="group">
                <button class="btn btn-primary me-2" onclick="descargarDiagnosticoPDF()">
                    <i class="bi bi-file-pdf"></i> Descargar PDF
                </button>
                <button class="btn btn-info me-2" onclick="crearPlanIntervension()">
                    <i class="bi bi-plus-circle"></i> Crear Plan de Intervención
                </button>
                <button class="btn btn-outline-secondary" onclick="nuevoFormulario()">
                    <i class="bi bi-arrow-clockwise"></i> Nuevo Formulario
                </button>
            </div>
        </div>
    `;

    // Mostrar después del contenido de resultados
    setTimeout(() => {
        elementos.resumenResultados.innerHTML += opcionesHtml;
    }, 500);
}

function descargarDiagnosticoPDF() {
    if (!estado.diagnosticoGenerado) return;

    const contenido = `
        DIAGNÓSTICO DE ORIENTACIÓN PARA DISGRAFÍA
        ============================================
        
        Estudiante: ${estado.diagnosticoGenerado.nombreEstudiante}
        Edad: ${estado.diagnosticoGenerado.edad} años
        Nivel: ${estado.diagnosticoGenerado.nivel}
        Fecha: ${new Date().toLocaleDateString("es-EC")}
        
        TIPO PREDOMINANTE: ${estado.diagnosticoGenerado.tipo.toUpperCase()}
        NIVEL DE RIESGO: ${estado.diagnosticoGenerado.nivelRiesgo.toUpperCase()}
        
        SÍNTOMAS OBSERVADOS:
        - Motores: ${estado.diagnosticoGenerado.caracteristicas.motores.join(", ") || "Ninguno"}
        - Espaciales: ${estado.diagnosticoGenerado.caracteristicas.espaciales.join(", ") || "Ninguno"}
        - Conversión: ${estado.diagnosticoGenerado.caracteristicas.conversion.join(", ") || "Ninguno"}
        - Fonológicos: ${estado.diagnosticoGenerado.caracteristicas.fonologicos.join(", ") || "Ninguno"}
        
        NOTA: Esta es una orientación pedagógica. Se recomienda evaluación profesional.
    `;

    const blob = new Blob([contenido], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Diagnostico_${estado.diagnosticoGenerado.nombreEstudiante.replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    mostrarNotificacion("Diagnóstico descargado", "success");
}

function crearPlanIntervension() {
    // TODO: Redirigir a módulo de planes de intervención
    mostrarNotificacion("Redirigiendo a crear plan de intervención...", "info");
    setTimeout(() => {
        window.location.href = "../../modules/planesIntervención/planes.html?diagnosticoId=" + estado.diagnosticoGenerado.id;
    }, 1500);
}

function nuevoFormulario() {
    if (confirm("¿Descartar los datos actuales y comenzar un nuevo formulario?")) {
        estado.pasoActual = 1;
        estado.datos = {
            nombreEstudiante: "",
            edadEstudiante: "",
            nivelEducativo: "",
            sintomasMotores: [],
            sintomasespaciales: [],
            sintomascConversion: [],
            sintomasFonologicos: [],
            severidad: "",
            intervencionPrevia: "",
            materialIntervension: "",
            otrosTrastornos: [],
            antecedentes: [],
            eventosSignificativos: "",
            observacionesAdicionales: "",
            derivacion: ""
        };
        estado.diagnosticoGenerado = null;
        mostrarPaso(1);
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
    elementos.btnSiguiente.addEventListener("click", () => {
        if (estado.pasoActual < estado.totalPasos) {
            mostrarPaso(estado.pasoActual + 1);
        }
    });

    elementos.btnAnterior.addEventListener("click", () => {
        if (estado.pasoActual > 1) {
            guardarDatosPasoActual();
            estado.pasoActual--;
            mostrarPaso(estado.pasoActual);
        }
    });

    elementos.btnGuardar.addEventListener("click", guardarDiagnostico);

    // Permitir Enter para avanzar
    document.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && estado.pasoActual < estado.totalPasos) {
            if (document.activeElement.type !== "textarea") {
                mostrarPaso(estado.pasoActual + 1);
            }
        }
    });
}

// Exportar funciones para uso desde HTML
window.descargarDiagnosticoPDF = descargarDiagnosticoPDF;
window.crearPlanIntervension = crearPlanIntervension;
window.nuevoFormulario = nuevoFormulario;
