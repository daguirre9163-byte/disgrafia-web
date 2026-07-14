import {
    crearArticuloBiblioteca,
    obtenerArticulosBiblioteca,
    obtenerArticuloBiblioteca,
    buscarEnBiblioteca
} from "../../firebase/firestore.js";

import { obtenerConCache, guardarCache } from "../../js/firestore-service.js";

const CACHE_KEY = "cache.biblioteca";

// Categorías de la biblioteca
export const CATEGORIAS_BIBLIOTECA = {
    que_es: "¿Qué es la disgrafía?",
    tipos: "Tipos de disgrafía",
    causas: "Causas",
    sintomas: "Síntomas",
    deteccion: "Cómo detectarla",
    senales_alerta: "Señales de alerta",
    diferencias: "Diferencias con otros trastornos",
    intervencion: "Intervención educativa",
    buenas_practicas: "Buenas prácticas",
    investigacion: "Investigación",
    normativa: "Normativa educativa",
    videos: "Videos",
    infografias: "Infografías",
    faq: "Preguntas frecuentes"
};

// Datos iniciales de la biblioteca
export const CONTENIDO_INICIAL_BIBLIOTECA = [
    {
        titulo: "¿Qué es la Disgrafía?",
        categoria: "que_es",
        tipo: "articulo",
        contenido: `<h3>Definición</h3>
<p>La disgrafía es un trastorno específico de la escritura que afecta la capacidad de escribir correctamente, aunque la inteligencia sea normal y no existan problemas motores graves.</p>
<h3>Características</h3>
<ul>
<li>Dificultad en la coordinación motora fina</li>
<li>Problemas en la organización del espacio</li>
<li>Errores en la conversión de sonidos a símbolos</li>
<li>Letra ilegible o desorganizada</li>
</ul>
<h3>Origen</h3>
<p>Puede ser de origen neurológico, motriz o funcional. No es culpa del estudiante ni indica falta de inteligencia.</p>`,
        resumen: "Trastorno específico de la escritura que afecta la capacidad de escribir correctamente.",
        etiquetas: ["disgrafía", "definición", "trastorno"],
        imagenPortada: null
    },
    {
        titulo: "Tipos de Disgrafía",
        categoria: "tipos",
        tipo: "articulo",
        contenido: `<h3>Disgrafía Motriz</h3>
<p>Afecta principalmente la coordinación motora fina. Se evidencia en presión irregular, velocidad y tamaño de letra inconsistente.</p>
<h3>Disgrafía Espacial</h3>
<p>Dificultad para organizar el espacio en la página. Problemas con márgenes, espaciamiento y alineación.</p>
<h3>Disgrafía Disléxica</h3>
<p>Problemas en la conversión de sonidos a símbolos. Incluye inversiones, rotaciones y omisiones de letras.</p>
<h3>Disgrafía Fonológica</h3>
<p>Dificultad en la conversión fonema-grafema. Errores en segmentación y omisión de sílabas.</p>
<h3>Disgrafía Evolutiva</h3>
<p>Retraso en el desarrollo normal de la escritura. La más común en niños.</p>
<h3>Disgrafía Adquirida</h3>
<p>Pérdida o deterioro por lesión cerebral o enfermedad.</p>`,
        resumen: "Clasificación de los principales tipos de disgrafía y sus características.",
        etiquetas: ["tipos", "clasificación", "motriz", "espacial", "disléxica"],
        imagenPortada: null
    },
    {
        titulo: "Diferencias: Disgrafía vs Dislexia",
        categoria: "diferencias",
        tipo: "articulo",
        contenido: `<h3>Disgrafía</h3>
<ul>
<li>Afecta principalmente la ESCRITURA</li>
<li>Problemas motores y de organización</li>
<li>Letra ilegible o desorganizada</li>
<li>Errores en la conversión grafema-fonema</li>
</ul>
<h3>Dislexia</h3>
<ul>
<li>Afecta principalmente la LECTURA</li>
<li>Problemas en procesamiento fonológico</li>
<li>Dificultad para reconocer palabras</li>
<li>Problemas en fluidez lectora</li>
</ul>
<h3>Pueden Coexistir</h3>
<p>Un estudiante puede tener tanto disgrafía como dislexia (dismorfodislexia). Requieren intervención coordinada.</p>`,
        resumen: "Aclaraciones sobre las diferencias entre disgrafía y otros trastornos.",
        etiquetas: ["diferencias", "dislexia", "diagnóstico diferencial"],
        imagenPortada: null
    },
    {
        titulo: "Señales de Alerta",
        categoria: "senales_alerta",
        tipo: "articulo",
        contenido: `<h3>En Educación Inicial (4-5 años)</h3>
<ul>
<li>Dificultad para garabatear en forma intencional</li>
<li>No muestra interés por dibujar o escribir</li>
<li>Pobre coordinación motora gruesa</li>
</ul>
<h3>En Básica Elemental (6-7 años)</h3>
<ul>
<li>Escritura muy lenta o muy rápida</li>
<li>Letra ilegible o inconsistente</li>
<li>Problemas para recordar letra/número</li>
</ul>
<h3>En Básica Media (8-9 años)</h3>
<ul>
<li>Espaciamiento irregular entre letras</li>
<li>Márgenes descuidados</li>
<li>Escritura de baja calidad</li>
<li>Postura corporal anómala al escribir</li>
</ul>
<h3>En Básica Superior (10-12 años)</h3>
<ul>
<li>Velocidad de escritura reducida</li>
<li>Errores ortográficos recurrentes</li>
<li>Expresión escrita limitada</li>
<li>Fatiga evidente al escribir</li>
</ul>`,
        resumen: "Indicadores que sugieren la presencia de disgrafía según el nivel educativo.",
        etiquetas: ["señales", "alerta", "indicadores", "edad"],
        imagenPortada: null
    },
    {
        titulo: "Intervención Educativa",
        categoria: "intervencion",
        tipo: "articulo",
        contenido: `<h3>Evaluación Inicial</h3>
<p>Realizar una evaluación integral que incluya: motricidad fina, coordinación visual-motora, presión del lápiz, velocidad de escritura.</p>
<h3>Estrategias Multisensoriales</h3>
<ul>
<li>Combinar visual, auditivo, kinestésico y táctil</li>
<li>Actividades de trazado con diferentes texturas</li>
<li>Escritura en aire, arena, agua</li>
</ul>
<h3>Intervención Motora</h3>
<ul>
<li>Ejercicios de motricidad fina</li>
<li>Actividades de coordinación ojo-mano</li>
<li>Fortalecimiento muscular</li>
<li>Control de presión del lápiz</li>
</ul>
<h3>Adaptaciones Didácticas</h3>
<ul>
<li>Papel pautado o con cuadrículas</li>
<li>Lápices ergonómicos</li>
<li>Reducción de cantidad de trabajo</li>
<li>Énfasis en contenido sobre forma</li>
</ul>
<h3>Seguimiento</h3>
<p>Monitoreo regular del progreso, ajuste de estrategias, comunicación con familia.</p>`,
        resumen: "Estrategias y adaptaciones para trabajar con estudiantes con disgrafía.",
        etiquetas: ["intervención", "estrategias", "adaptaciones"],
        imagenPortada: null
    },
    {
        titulo: "Preguntas Frecuentes",
        categoria: "faq",
        tipo: "articulo",
        contenido: `<h3>¿La disgrafía desaparece con la edad?</h3>
<p>Sin intervención, los problemas tienden a persistir. Con tratamiento adecuado, muchos estudiantes mejoran significativamente.</p>
<h3>¿Es la disgrafía un problema de inteligencia?</h3>
<p>No. Los estudiantes con disgrafía tienen inteligencia normal. El problema es específico en la escritura.</p>
<h3>¿Debo enviar al niño a un especialista?</h3>
<p>Se recomienda derivar a psicólogo, psicopedagogo o terapeuta ocupacional si la disgrafía es severa o afecta significativamente el aprendizaje.</p>
<h3>¿Qué puedo hacer como docente?</h3>
<p>Utilizar estrategias multisensoriales, proporcionar adaptaciones, mantener comunicación con familia y especialistas.</p>
<h3>¿Es contagioso o hereditario?</h3>
<p>No es contagioso. Algunos tipos pueden tener componente hereditario, pero no es determinante.</p>`,
        resumen: "Respuestas a preguntas comunes sobre disgrafía.",
        etiquetas: ["faq", "preguntas", "respuestas"],
        imagenPortada: null
    }
];

export async function crearArticuloBibliotecaServicio(datos) {
    if (!datos?.titulo) {
        throw new Error("El artículo debe tener un título.");
    }

    if (!datos?.categoria) {
        throw new Error("El artículo debe tener una categoría.");
    }

    const articulo = await crearArticuloBiblioteca(datos);
    guardarCache(CACHE_KEY, null);
    guardarCache(`${CACHE_KEY}.categoria.${datos.categoria}`, null);

    return articulo;
}

export async function obtenerArticulosBibliotecaServicio(filtros = {}) {
    const cacheKey = filtros.categoria 
        ? `${CACHE_KEY}.categoria.${filtros.categoria}`
        : CACHE_KEY;

    return obtenerConCache(
        cacheKey,
        () => obtenerArticulosBiblioteca(filtros),
        120000 // 2 minutos
    );
}

export async function obtenerArticuloBibliotecaServicio(id) {
    return obtenerArticuloBiblioteca(id);
}

export async function obtenerArticulosPorCategoriaServicio(categoria) {
    return obtenerArticulosBibliotecaServicio({ categoria });
}

export async function buscarEnBibliotecaServicio(termino) {
    if (!termino || termino.trim().length < 2) {
        return [];
    }

    return buscarEnBiblioteca(termino);
}

export async function obtenerCategoríasConContenido() {
    const articulos = await obtenerArticulosBibliotecaServicio();
    const categoriasUsadas = new Set(articulos.map(a => a.categoria));

    return Object.entries(CATEGORIAS_BIBLIOTECA)
        .filter(([key]) => categoriasUsadas.has(key))
        .map(([key, nombre]) => ({
            id: key,
            nombre,
            cantidad: articulos.filter(a => a.categoria === key).length
        }));
}

export async function inicializarBibliotecaServicio() {
    try {
        const articulos = await obtenerArticulosBibliotecaServicio();
        
        if (articulos.length > 0) {
            console.log("Biblioteca ya inicializada");
            return { inicializada: true, articulos: articulos.length };
        }

        // Crear contenido inicial
        const resultados = await Promise.all(
            CONTENIDO_INICIAL_BIBLIOTECA.map(contenido =>
                crearArticuloBibliotecaServicio(contenido)
            )
        );

        return {
            inicializada: true,
            articulos: resultados.length,
            mensaje: `Biblioteca inicializada con ${resultados.length} artículos`
        };
    } catch (error) {
        console.error("Error inicializando biblioteca:", error);
        return {
            inicializada: false,
            error: error.message
        };
    }
}

export function obtenerNombreCategoria(categoria) {
    return CATEGORIAS_BIBLIOTECA[categoria] || categoria;
}

export function obtenerCategoriasPorTipo(tipo) {
    const categoriasPorTipo = {
        conceptual: ["que_es", "tipos", "causas", "sintomas"],
        practica: ["deteccion", "intervencion", "buenas_practicas"],
        diferencial: ["diferencias", "senales_alerta"],
        referencia: ["investigacion", "normativa", "faq"],
        multimedia: ["videos", "infografias"]
    };

    return categoriasPorTipo[tipo] || [];
}
