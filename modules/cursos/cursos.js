import {
  crearCursoServicio,
  listarCursosServicio,
  actualizarCursoServicio,
  eliminarCursoServicio,
  obtenerCursoServicio,
  validarEliminacionCursoServicio
} from "./cursos-service.js";

import { listarParalelosServicio } from "../paralelos/paralelos-service.js";
import { obtenerEstudiantesServicio } from "../estudiantes/estudiantes-service.js";
import { registrarNotificacion } from "../../js/notificaciones.js";
import { sanitizarTexto } from "../../js/validaciones.js";

let cursos = [];
let paralelos = [];
let estudiantes = [];
let modal;
let editando = false;
let cursoId = null;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

async function init() {
  modal = new bootstrap.Modal(document.getElementById("modalCurso"));
  bindEvents();
  await cargarCursos();
}

function bindEvents() {
  document.getElementById("btnNuevoCurso")?.addEventListener("click", nuevoCurso);
  document.getElementById("btnCrearPrimerCurso")?.addEventListener("click", nuevoCurso);
  document.getElementById("btnGuardarCurso")?.addEventListener("click", guardarCurso);
  document.getElementById("buscarCurso")?.addEventListener("input", filtrarCursos);
}

function nuevoCurso() {
  editando = false;
  cursoId = null;
  document.getElementById("formCurso")?.reset();
  document.getElementById("estadoCurso").value = "activo";
  modal.show();
}

function enriquecerCursos(lista = []) {
  const paralelosPorCurso = paralelos.reduce((acc, paralelo) => {
    acc[paralelo.cursoId] = acc[paralelo.cursoId] || [];
    acc[paralelo.cursoId].push(paralelo);
    return acc;
  }, {});

  const estudiantesPorCurso = estudiantes.reduce((acc, estudiante) => {
    acc[estudiante.cursoId] = (acc[estudiante.cursoId] || 0) + 1;
    return acc;
  }, {});

  return lista.map((curso) => ({
    ...curso,
    paralelos: ordenarParalelos(paralelosPorCurso[curso.id] || []),
    totalParalelos: (paralelosPorCurso[curso.id] || []).length,
    totalEstudiantes: estudiantesPorCurso[curso.id] || 0
  }));
}

function ordenarParalelos(lista = []) {
  return [...lista].sort((a, b) => String(a.nombre || "").localeCompare(String(b.nombre || ""), "es"));
}

async function guardarCurso() {
  const datos = {
    nombre: sanitizarTexto(document.getElementById("nombreCurso").value.trim()),
    nivel: document.getElementById("nivelCurso").value,
    estado: document.getElementById("estadoCurso").value,
    jornada: document.getElementById("jornadaCurso").value,
    descripcion: sanitizarTexto(document.getElementById("descripcionCurso").value.trim())
  };

  if (!datos.nombre || !datos.nivel) {
    await registrarNotificacion({ mensaje: "Completa nombre y nivel del curso.", tipo: "danger" });
    return;
  }

  try {
    if (editando) {
      await actualizarCursoServicio(cursoId, datos);
      await registrarNotificacion({ mensaje: "Curso actualizado correctamente.", tipo: "success" });
    } else {
      await crearCursoServicio(datos);
      await registrarNotificacion({ mensaje: "Curso creado correctamente.", tipo: "success" });
    }

    modal.hide();
    document.getElementById("formCurso")?.reset();
    await cargarCursos();
  } catch (error) {
    await registrarNotificacion({ mensaje: error.message || "No se pudo guardar el curso.", tipo: "danger" });
  }
}

async function cargarCursos() {
  try {
    const [listaCursos, listaParalelos, listaEstudiantes] = await Promise.all([
      listarCursosServicio(),
      listarParalelosServicio(),
      obtenerEstudiantesServicio()
    ]);

    paralelos = listaParalelos;
    estudiantes = listaEstudiantes;
    cursos = enriquecerCursos(listaCursos);

    render(cursos);
    actualizarIndicadores();
  } catch (error) {
    console.error("Error cargando cursos:", error);
    await registrarNotificacion({ mensaje: "No se pudieron cargar los cursos.", tipo: "danger" });
  }
}

function render(lista) {
  const cont = document.getElementById("contenedorCursos");
  if (!cont) return;

  if (!lista.length) {
    cont.innerHTML = `
      <div class="col-12">
        <div class="empty-state">
          <i class="bi bi-book"></i>
          <h4>No existen cursos registrados</h4>
          <p>Crea tu primer curso para comenzar a gestionar paralelos y estudiantes.</p>
          <button class="btn btn-primary" id="crearDesdeVacio" type="button">Crear mi primer curso</button>
        </div>
      </div>`;
    document.getElementById("crearDesdeVacio")?.addEventListener("click", nuevoCurso);
    return;
  }

  cont.innerHTML = lista.map((curso) => {
    const paralelosVisibles = curso.paralelos.slice(0, 5);
    const paralelosRestantes = curso.paralelos.length - paralelosVisibles.length;
    const resumenParalelos = curso.paralelos.length
      ? [
          ...paralelosVisibles.map((paralelo) => `<span class="badge bg-light text-dark border">${sanitizarTexto(paralelo.nombre)}</span>`),
          paralelosRestantes > 0 ? `<span class="badge bg-secondary">+${paralelosRestantes}</span>` : ""
        ].join(" ")
      : '<span class="badge bg-warning text-dark">Sin paralelos</span>';

    return `
      <div class="col-lg-4 col-md-6">
        <div class="card h-100 border-0 shadow-sm course-card">
          <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
            <h5 class="mb-0">${sanitizarTexto(curso.nombre)}</h5>
            <span class="badge bg-white text-primary text-uppercase">${sanitizarTexto(curso.estado || "activo")}</span>
          </div>
          <div class="card-body">
            <p class="mb-2"><strong>Nivel:</strong> ${sanitizarTexto(curso.nivel || "-")}</p>
            <p class="mb-2"><strong>Jornada:</strong> ${sanitizarTexto(curso.jornada || "No definida")}</p>
            <p class="mb-3"><strong>Descripción:</strong> ${sanitizarTexto(curso.descripcion || "Sin descripción")}</p>

            <div class="row g-2 mb-3">
              <div class="col-6">
                <div class="p-2 bg-light rounded text-center">
                  <div class="h6 mb-0">${curso.totalParalelos}</div>
                  <small class="text-muted">Paralelos</small>
                </div>
              </div>
              <div class="col-6">
                <div class="p-2 bg-light rounded text-center">
                  <div class="h6 mb-0">${curso.totalEstudiantes}</div>
                  <small class="text-muted">Estudiantes</small>
                </div>
              </div>
            </div>

            <div class="d-flex flex-wrap gap-2">${resumenParalelos}</div>
          </div>
          <div class="card-footer bg-white border-top">
            <div class="d-grid gap-2">
              <button class="btn btn-sm btn-outline-success gestionar" data-id="${curso.id}" type="button">
                <i class="bi bi-diagram-3"></i> Gestionar Paralelos
              </button>
              <div class="d-flex gap-2">
                <button class="btn btn-sm btn-outline-primary flex-grow-1 editar" data-id="${curso.id}" type="button">
                  <i class="bi bi-pencil"></i> Editar
                </button>
                <button class="btn btn-sm btn-outline-danger eliminar" data-id="${curso.id}" type="button">
                  <i class="bi bi-trash"></i> Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join("");

  document.querySelectorAll(".editar").forEach((boton) => {
    boton.addEventListener("click", () => editar(boton.dataset.id));
  });

  document.querySelectorAll(".eliminar").forEach((boton) => {
    boton.addEventListener("click", () => borrar(boton.dataset.id));
  });

  document.querySelectorAll(".gestionar").forEach((boton) => {
    boton.addEventListener("click", () => gestionarParalelos(boton.dataset.id));
  });
}

function actualizarIndicadores() {
  document.getElementById("totalCursos").textContent = cursos.length;
  document.getElementById("totalParalelos").textContent = cursos.reduce((acc, curso) => acc + Number(curso.totalParalelos || 0), 0);
  document.getElementById("totalEstudiantes").textContent = cursos.reduce((acc, curso) => acc + Number(curso.totalEstudiantes || 0), 0);
}

function filtrarCursos(e) {
  const texto = e.target.value.toLowerCase();
  render(cursos.filter((curso) =>
    sanitizarTexto(curso.nombre).toLowerCase().includes(texto) ||
    sanitizarTexto(curso.nivel || "").toLowerCase().includes(texto)
  ));
}

async function editar(id) {
  const curso = await obtenerCursoServicio(id);
  if (!curso) return;

  editando = true;
  cursoId = id;

  document.getElementById("nombreCurso").value = curso.nombre || "";
  document.getElementById("nivelCurso").value = curso.nivel || "";
  document.getElementById("estadoCurso").value = curso.estado || "activo";
  document.getElementById("jornadaCurso").value = curso.jornada || "";
  document.getElementById("descripcionCurso").value = curso.descripcion || "";

  modal.show();
}

async function borrar(id) {
  const validacion = await validarEliminacionCursoServicio(id);

  if (!validacion.valido) {
    await registrarNotificacion({
      mensaje: validacion.mensaje || "No se puede eliminar el curso seleccionado.",
      tipo: "danger"
    });
    return;
  }

  if (!confirm("¿Eliminar este curso? Esta acción no se puede deshacer.")) return;

  try {
    await eliminarCursoServicio(id);
    await registrarNotificacion({ mensaje: "Curso eliminado correctamente.", tipo: "warning" });
    await cargarCursos();
  } catch (error) {
    await registrarNotificacion({ mensaje: error.message || "No se pudo eliminar el curso.", tipo: "danger" });
  }
}

function gestionarParalelos(id) {
  sessionStorage.setItem("paralelos.cursoId", id);
  document.querySelector('[data-module="paralelos"]')?.click();
}

window.cargarCursos = cargarCursos;
