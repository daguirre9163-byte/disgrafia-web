import {
  crearCursoServicio,
  listarCursosServicio,
  actualizarCursoServicio,
  eliminarCursoServicio,
  obtenerCursoServicio
} from "./cursos-service.js";

let cursos = [];
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
    nombre: document.getElementById("nombreCurso").value.trim(),
    paralelo: document.getElementById("paraleloCurso").value.trim(),
    nivel: document.getElementById("nivelCurso").value,
    jornada: document.getElementById("jornadaCurso").value,
    descripcion: document.getElementById("descripcionCurso").value.trim()
  };

  if (!datos.nombre || !datos.paralelo) {
    alert("Complete los campos obligatorios.");
    return;
  }

  if (editando) {
    await actualizarCursoServicio(cursoId, datos);
  } else {
    await crearCursoServicio(datos);
  }

  modal.hide();
  document.getElementById("formCurso").reset();
  await cargarCursos();
}

async function cargarCursos() {
  cursos = await listarCursosServicio();
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
          <button class="btn btn-primary" id="crearDesdeVacio">Crear curso</button>
        </div>
      </div>`;
    document.getElementById("crearDesdeVacio")?.addEventListener("click", nuevoCurso);
    return;
  }

  cont.innerHTML = lista.map(c => `
    <div class="col-lg-4 col-md-6">
      <div class="course-card">
        <div class="course-header">
          <h4>${c.nombre} ${c.paralelo}</h4>
          <small>${c.nivel}</small>
        </div>
        <div class="course-body">
          <div class="course-info"><i class="bi bi-clock"></i>${c.jornada}</div>
          <div class="course-info"><i class="bi bi-mortarboard"></i>${c.totalEstudiantes || 0} estudiantes</div>
        </div>
        <div class="course-footer">
          <button class="btn btn-outline-warning editar" data-id="${c.id}">Editar</button>
          <button class="btn btn-outline-danger eliminar" data-id="${c.id}">Eliminar</button>
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
    curso.nombre.toLowerCase().includes(texto) ||
    curso.paralelo.toLowerCase().includes(texto) ||
    curso.nivel.toLowerCase().includes(texto)
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
  if (!confirm("¿Eliminar este curso?")) return;
  await eliminarCursoServicio(id);
  await cargarCursos();
}
