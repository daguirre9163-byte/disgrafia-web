import {
    obtenerArticulosBibliotecaServicio,
    obtenerArticuloBibliotecaServicio,
    obtenerArticulosPorCategoriaServicio,
    buscarEnBibliotecaServicio,
    obtenerCategoríasConContenido,
    inicializarBibliotecaServicio,
    obtenerNombreCategoria,
    CATEGORIAS_BIBLIOTECA
} from "./biblioteca-service.js";

// Estado de la aplicación
const estado = {
    articuloActual: null,
    categoriaActual: null,
    todosLosArticulos: [],
    categorias: [],
    modo: "categorias" // "categorias" | "busqueda" | "articulo"
};

// Elementos del DOM
const elementos = {
    indicadorCarga: document.getElementById("indicadorCarga"),
    seccionBienvenida: document.getElementById("seccionBienvenida"),
    categoriasList: document.getElementById("categoriasList"),
    inputBusqueda: document.getElementById("inputBusqueda"),
    btnBuscar: document.getElementById("btnBuscar"),
    articulosPorCategoria: document.getElementById("articulosPorCategoria"),
    resultadosBusqueda: document.getElementById("resultadosBusqueda"),
    listadoResultados: document.getElementById("listadoResultados"),
    cantidadResultados: document.getElementById("cantidadResultados"),
    lectorArticulo: document.getElementById("lectorArticulo"),
    articuloTitulo: document.getElementById("articuloTitulo"),
    articuloMeta: document.getElementById("articuloMeta"),
    articuloContenido: document.getElementById("articuloContenido"),
    articuloCategoria: document.getElementById("articuloCategoria"),
    articuloTipo: document.getElementById("articuloTipo"),
    articuloEtiquetas: document.getElementById("articuloEtiquetas"),
    btnVolver: document.getElementById("btnVolver"),
    btnCompartir: document.getElementById("btnCompartir"),
    btnDescargar: document.getElementById("btnDescargar"),
    btnTema: document.getElementById("btnTema"),
    toastNotificacion: document.getElementById("toastNotificacion"),
    toastMensaje: document.getElementById("toastMensaje")
};

// Inicialización
document.addEventListener("DOMContentLoaded", async () => {
    console.log("🚀 Inicializando Biblioteca de Disgrafía...");
    
    try {
        // Inicializar tema
        inicializarTema();
        
        // Inicializar biblioteca (crear contenido base si no existe)
        const resultado = await inicializarBibliotecaServicio();
        console.log("✅ Biblioteca inicializada:", resultado);

        // Cargar categorías
        await cargarCategorias();

        // Cargar artículos
        await cargarArticulosInicial();

        // Configurar event listeners
        configurarEventListeners();

        // Mostrar bienvenida
        mostrarBienvenida();

        elementos.indicadorCarga.style.display = "none";
    } catch (error) {
        console.error("❌ Error inicializando biblioteca:", error);
        mostrarNotificacion("Error al cargar la biblioteca", "danger");
    }
});

// ==========================================
// FUNCIONES PRINCIPALES
// ==========================================

async function cargarCategorias() {
    try {
        const categorias = await obtenerCategoríasConContenido();
        estado.categorias = categorias;
        renderizarCategorias(categorias);
    } catch (error) {
        console.error("Error cargando categorías:", error);
    }
}

async function cargarArticulosInicial() {
    try {
        const articulos = await obtenerArticulosBibliotecaServicio();
        estado.todosLosArticulos = articulos;
    } catch (error) {
        console.error("Error cargando artículos:", error);
    }
}

async function cargarArticulosPorCategoria(categoria) {
    try {
        elementos.indicadorCarga.style.display = "block";
        
        const articulos = await obtenerArticulosPorCategoriaServicio(categoria);
        
        renderizarArticulosPorCategoria(categoria, articulos);
        
        elementos.indicadorCarga.style.display = "none";
        estado.categoriaActual = categoria;
        estado.modo = "categorias";
    } catch (error) {
        console.error("Error cargando artículos:", error);
        mostrarNotificacion("Error al cargar artículos", "danger");
    }
}

async function cargarArticulo(articuloId) {
    try {
        elementos.indicadorCarga.style.display = "block";
        
        const articulo = await obtenerArticuloBibliotecaServicio(articuloId);
        
        if (!articulo) {
            mostrarNotificacion("Artículo no encontrado", "warning");
            return;
        }

        estado.articuloActual = articulo;
        renderizarArticulo(articulo);
        
        elementos.indicadorCarga.style.display = "none";
        estado.modo = "articulo";
    } catch (error) {
        console.error("Error cargando artículo:", error);
        mostrarNotificacion("Error al cargar el artículo", "danger");
    }
}

async function realizarBusqueda(termino) {
    if (!termino || termino.trim().length < 2) {
        mostrarNotificacion("Ingrese al menos 2 caracteres para buscar", "info");
        return;
    }

    try {
        elementos.indicadorCarga.style.display = "block";
        
        const resultados = await buscarEnBibliotecaServicio(termino);
        
        if (resultados.length === 0) {
            elementos.cantidadResultados.textContent = "0";
            elementos.listadoResultados.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-info">
                        <i class="bi bi-info-circle"></i>
                        No se encontraron artículos con "${termino}"
                    </div>
                </div>
            `;
        } else {
            elementos.cantidadResultados.textContent = resultados.length;
            renderizarResultadosBusqueda(resultados);
        }

        // Mostrar resultados
        elementos.seccionBienvenida.style.display = "none";
        elementos.articulosPorCategoria.innerHTML = "";
        elementos.lectorArticulo.style.display = "none";
        elementos.resultadosBusqueda.style.display = "block";

        estado.modo = "busqueda";
        
        elementos.indicadorCarga.style.display = "none";
    } catch (error) {
        console.error("Error en búsqueda:", error);
        mostrarNotificacion("Error al buscar", "danger");
    }
}

// ==========================================
// FUNCIONES DE RENDERIZADO
// ==========================================

function renderizarCategorias(categorias) {
    elementos.categoriasList.innerHTML = categorias.map(cat => `
        <a href="#" 
           class="list-group-item list-group-item-action categoria-btn" 
           data-categoria="${cat.id}">
            <div class="d-flex justify-content-between align-items-center">
                <span>${cat.nombre}</span>
                <span class="badge bg-primary rounded-pill">${cat.cantidad}</span>
            </div>
        </a>
    `).join("");

    // Event listeners para categorías
    document.querySelectorAll(".categoria-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            const categoria = btn.dataset.categoria;
            cargarArticulosPorCategoria(categoria);
        });
    });
}

function renderizarArticulosPorCategoria(categoria, articulos) {
    const nombreCategoria = obtenerNombreCategoria(categoria);
    
    let html = `
        <h3 class="mb-4">
            <i class="bi bi-folder-check"></i> ${nombreCategoria}
        </h3>
        <div class="row">
    `;

    articulos.forEach(articulo => {
        html += `
            <div class="col-md-6 mb-3">
                <div class="card h-100 shadow-sm articulo-card cursor-pointer" data-articulo="${articulo.id}">
                    <div class="card-body">
                        <h5 class="card-title">${articulo.titulo}</h5>
                        <p class="card-text text-muted">${articulo.resumen || ""}</p>
                        <div class="d-flex gap-2 flex-wrap">
                            <span class="badge bg-secondary">${articulo.tipo}</span>
                            ${articulo.etiquetas ? articulo.etiquetas.slice(0, 2).map(tag => 
                                `<span class="badge bg-light text-dark">${tag}</span>`
                            ).join("") : ""}
                        </div>
                    </div>
                    <div class="card-footer bg-light">
                        <small class="text-muted">
                            <i class="bi bi-calendar"></i> ${formatearFecha(articulo.createdAt)}
                        </small>
                    </div>
                </div>
            </div>
        `;
    });

    html += "</div>";

    elementos.seccionBienvenida.style.display = "none";
    elementos.resultadosBusqueda.style.display = "none";
    elementos.lectorArticulo.style.display = "none";
    elementos.articulosPorCategoria.innerHTML = html;

    // Event listeners para artículos
    document.querySelectorAll(".articulo-card").forEach(card => {
        card.addEventListener("click", () => {
            const articuloId = card.dataset.articulo;
            cargarArticulo(articuloId);
        });
    });
}

function renderizarResultadosBusqueda(articulos) {
    let html = "";

    articulos.forEach(articulo => {
        html += `
            <div class="col-md-6 mb-3">
                <div class="card h-100 shadow-sm articulo-card cursor-pointer" data-articulo="${articulo.id}">
                    <div class="card-body">
                        <h5 class="card-title">${articulo.titulo}</h5>
                        <p class="card-text text-muted">${articulo.resumen || ""}</p>
                        <div class="d-flex gap-2 flex-wrap">
                            <span class="badge bg-secondary">${articulo.tipo}</span>
                            <span class="badge bg-info">${obtenerNombreCategoria(articulo.categoria)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    elementos.listadoResultados.innerHTML = html;

    // Event listeners para artículos en resultados
    document.querySelectorAll(".articulo-card").forEach(card => {
        card.addEventListener("click", () => {
            const articuloId = card.dataset.articulo;
            cargarArticulo(articuloId);
        });
    });
}

function renderizarArticulo(articulo) {
    // Título y metadatos
    elementos.articuloTitulo.textContent = articulo.titulo;
    elementos.articuloMeta.innerHTML = `
        Publicado: ${formatearFecha(articulo.createdAt)} | 
        Categoría: ${obtenerNombreCategoria(articulo.categoria)}
    `;

    // Categoría y tipo
    elementos.articuloCategoria.textContent = obtenerNombreCategoria(articulo.categoria);
    elementos.articuloTipo.textContent = articulo.tipo;

    // Contenido
    elementos.articuloContenido.innerHTML = DOMPurify.sanitize(articulo.contenido);

    // Etiquetas
    if (articulo.etiquetas && articulo.etiquetas.length > 0) {
        elementos.articuloEtiquetas.innerHTML = articulo.etiquetas
            .map(tag => `<span class="badge bg-light text-dark me-2">${tag}</span>`)
            .join("");
    } else {
        elementos.articuloEtiquetas.innerHTML = "<small class='text-muted'>Sin etiquetas</small>";
    }

    // Mostrar lector
    elementos.seccionBienvenida.style.display = "none";
    elementos.articulosPorCategoria.innerHTML = "";
    elementos.resultadosBusqueda.style.display = "none";
    elementos.lectorArticulo.style.display = "block";

    // Scroll al inicio
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function mostrarBienvenida() {
    elementos.seccionBienvenida.style.display = "block";
    elementos.articulosPorCategoria.innerHTML = "";
    elementos.resultadosBusqueda.style.display = "none";
    elementos.lectorArticulo.style.display = "none";
}

// ==========================================
// UTILIDADES
// ==========================================

function formatearFecha(timestamp) {
    if (!timestamp) return "Fecha no disponible";
    
    const fecha = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return fecha.toLocaleDateString("es-EC", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

function mostrarNotificacion(mensaje, tipo = "info") {
    elementos.toastMensaje.textContent = mensaje;
    elementos.toastNotificacion.className = `toast show bg-${tipo}`;
    
    const toast = new bootstrap.Toast(elementos.toastNotificacion);
    toast.show();
}

function compartirArticulo() {
    const articulo = estado.articuloActual;
    
    if (!articulo) return;

    const textoCompartir = `${articulo.titulo} - Biblioteca de Disgrafía SIGEDIS`;
    const urlActual = window.location.href;

    if (navigator.share) {
        navigator.share({
            title: "Biblioteca SIGEDIS",
            text: textoCompartir,
            url: urlActual
        }).catch(err => console.log("Error compartiendo:", err));
    } else {
        // Copiar al portapapeles
        navigator.clipboard.writeText(`${textoCompartir}\n${urlActual}`)
            .then(() => mostrarNotificacion("Link copiado al portapapeles", "success"))
            .catch(() => mostrarNotificacion("Error al copiar", "danger"));
    }
}

function descargarArticulo() {
    const articulo = estado.articuloActual;
    
    if (!articulo) return;

    const html = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>${articulo.titulo}</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px; }
                h1 { color: #0d6efd; }
                .meta { color: #666; margin: 20px 0; }
                .contenido { margin: 30px 0; }
                .etiquetas { margin-top: 30px; }
                .badge { display: inline-block; padding: 5px 10px; background: #e9ecef; margin: 5px 5px 5px 0; border-radius: 3px; }
            </style>
        </head>
        <body>
            <h1>${articulo.titulo}</h1>
            <div class="meta">
                <p><strong>Categoría:</strong> ${obtenerNombreCategoria(articulo.categoria)}</p>
                <p><strong>Tipo:</strong> ${articulo.tipo}</p>
                <p><strong>Publicado:</strong> ${formatearFecha(articulo.createdAt)}</p>
            </div>
            <div class="contenido">
                ${articulo.contenido}
            </div>
            <div class="etiquetas">
                <h4>Etiquetas:</h4>
                ${articulo.etiquetas.map(tag => `<span class="badge">${tag}</span>`).join("")}
            </div>
            <hr>
            <p><small>Extraído de la Biblioteca de Disgrafía - SIGEDIS</small></p>
        </body>
        </html>
    `;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${articulo.titulo.replace(/\s+/g, "_")}.html`;
    a.click();
    URL.revokeObjectURL(url);

    mostrarNotificacion("Artículo descargado", "success");
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
    // Búsqueda
    elementos.btnBuscar.addEventListener("click", () => {
        const termino = elementos.inputBusqueda.value;
        realizarBusqueda(termino);
    });

    elementos.inputBusqueda.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            const termino = elementos.inputBusqueda.value;
            realizarBusqueda(termino);
        }
    });

    // Lector
    elementos.btnVolver.addEventListener("click", () => {
        if (estado.categoriaActual) {
            cargarArticulosPorCategoria(estado.categoriaActual);
        } else {
            mostrarBienvenida();
        }
    });

    elementos.btnCompartir.addEventListener("click", compartirArticulo);
    elementos.btnDescargar.addEventListener("click", descargarArticulo);
}

// Importar DOMPurify si no está en HTML
if (typeof DOMPurify === "undefined") {
    console.warn("DOMPurify no cargado. Usando innerHTML sin sanitizar.");
    window.DOMPurify = { sanitize: (html) => html };
}
