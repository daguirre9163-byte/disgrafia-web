import {
  crearCursoServicio,
  listarCursosServicio,
  actualizarCursoServicio,
  eliminarCursoServicio,
  obtenerCursoServicio
} from "./cursos-service.js";

import { obtenerEstudiantesServicio } from "../estudiantes/estudiantes-service.js";
import { registrarNotificacion } from "../../js/notificaciones.js";
import { sanitizarTexto } from "../../js/validaciones.js";

let cursos = [];
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
  document.getElementById("formCurso").reset();
  modal.show();
}

async function guardarCurso() {
  const datos = {
    nombre: sanitizarTexto(document.getElementById("nombreCurso").value.trim()),
    paralelo: sanitizarTexto(document.getElementById("paraleloCurso").value.trim()),
    nivel: document.getElementById("nivelCurso").value,
    jornada: document.getElementById("jornadaCurso").value,
    descripcion: sanitizarTexto(document.getElementById("descripcionCurso").value.trim())
  };

  if (!datos.nombre || !datos.paralelo) {
    await registrarNotificacion({ mensaje: "Completa nombre y paralelo", tipo: "danger" });
    return;
  }

  if (editando) {
    await actualizarCursoServicio(cursoId, datos);
    await registrarNotificacion({ mensaje: "Curso actualizado", tipo: "success" });
  } else {
    await crearCursoServicio(datos);
    await registrarNotificacion({ mensaje: "Curso creado correctamente", tipo: "success" });
  }

  modal.hide();
  document.getElementById("formCurso").reset();
  await cargarCursos();
}

async function cargarCursos() {
  cursos = await listarCursosServicio();
  estudiantes = await obtenerEstudiantesServicio();
  
  // CONTAR ESTUDIANTES POR CURSO
  const contadores = {};
  estudiantes.forEach(e => {
    contadores[e.cursoId] = (contadores[e.cursoId] || 0) + 1;
  });
  
  // ASIGNAR CONTADORES A CURSOS
  cursos.forEach(c => {
    c.totalEstudiantes = contadores[c.id] || 0;
  });
  
  render(cursos);
  actualizarIndicadores();
}

function render(lista) {
  const cont = document.getElementById("contenedorCursos");

  if (!lista.length) {
    cont.innerHTML = `
      <div class="col-12">
        <div class="empty-state">
          <i class="bi bi-book"></i>
          <h4>No existen cursos registrados</h4>
          <p>Crea tu primer curso para comenzar a gestionar estudiantes, evaluaciones y recursos.</p>
          <button class="btn btn-primary" id="crearDesdeVacio">Crear mi primer curso</button>
        </div>
      </div>`;
    document.getElementById("crearDesdeVacio")?.addEventListener("click", nuevoCurso);
    return;
  }

  cont.innerHTML = lista.map(c => `
    <div class="col-lg-4 col-md-6">
      <div class="card h-100 border-0 shadow-sm course-card">
        <div class="card-header bg-primary text-white">
          <h5 class="mb-0">${sanitizarTexto(c.nombre)} <small>${sanitizarTexto(c.paralelo)}</small></h5>
        </div>
        <div class="card-body">
          <p class="mb-2"><strong>Nivel:</strong> ${sanitizarTexto(c.nivel)}</p>
          <p class="mb-2"><strong>Jornada:</strong> ${sanitizarTexto(c.jornada)}</p>
          <p class="mb-3"><strong>Descripción:</strong> ${sanitizarTexto(c.descripcion || "Sin descripción")}</p>
          
          <!-- ESTADÍSTICAS -->
          <div class="row g-2 mb-3">
            <div class="col-6">
              <div class="p-2 bg-light rounded text-center">
                <div class="h6 mb-0">${c.totalEstudiantes || 0}</div>
                <small class="text-muted">Estudiantes</small>
              </div>
            </div>
            <div class="col-6">
              <div class="p-2 bg-light rounded text-center">
                <div class="h6 mb-0">2026-2027</div>
                <small class="text-muted">Período</small>
              </div>
            </div>
          </div>
        </div>
        <div class="card-footer bg-white border-top">
          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-outline-primary flex-grow-1 editar" data-id="${c.id}">
              <i class="bi bi-pencil"></i> Editar
            </button>
            <button class="btn btn-sm btn-outline-danger eliminar" data-id="${c.id}">
              <i class="bi bi-trash"></i> Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  `).join("");

  document.querySelectorAll(".editar").forEach((boton) => {
    boton.addEventListener("click", () => editar(boton.dataset.id));
  });

  document.querySelectorAll(".eliminar").forEach((boton) => {
    boton.addEventListener("click", () => borrar(boton.dataset.id));
  });
}

function actualizarIndicadores() {
  document.getElementById("totalCursos").textContent = cursos.length;
  document.getElementById("totalEstudiantes").textContent = cursos.reduce((acumulado, curso) => {
    return acumulado + Number(curso.totalEstudiantes || 0);
  }, 0);
}

function filtrarCursos(e) {
  const texto = e.target.value.toLowerCase();
  render(cursos.filter(curso =>
    sanitizarTexto(curso.nombre).toLowerCase().includes(texto) ||
    sanitizarTexto(curso.paralelo).toLowerCase().includes(texto) ||
    sanitizarTexto(curso.nivel).toLowerCase().includes(texto)
  ));
}

async function editar(id) {
  const curso = await obtenerCursoServicio(id);
  if (!curso) return;

  editando = true;
  cursoId = id;

  document.getElementById("nombreCurso").value = curso.nombre;
  document.getElementById("paraleloCurso").value = curso.paralelo;
  document.getElementById("nivelCurso").value = curso.nivel;
  document.getElementById("jornadaCurso").value = curso.jornada;
  document.getElementById("descripcionCurso").value = curso.descripcion || "";

  modal.show();
}

async function borrar(id) {
  const curso = cursos.find(c => c.id === id);
  const totalEstudiantes = curso?.totalEstudiantes || 0;
  
  if (totalEstudiantes > 0) {
    await registrarNotificacion({ 
      mensaje: `⚠️ No se puede eliminar. El curso tiene ${totalEstudiantes} estudiante(s) asignado(s).", 
      tipo: "danger" 
    });
    return;
  }
  
  if (!confirm("¿Eliminar este curso? Esta acción no se puede deshacer.")) return;
  
  await eliminarCursoServicio(id);
  await registrarNotificacion({ mensaje: "Curso eliminado", tipo: "warning" });
  await cargarCursos();
}

window.cargarCursos = cargarCursos;