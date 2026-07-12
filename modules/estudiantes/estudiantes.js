import { crearEstudiante, listarEstudiantes, actualizarEstudiante, eliminarEstudiante, obtenerEstudiante } from '../../firebase/firestore.js';
import { guardarLocal } from '../../js/modules/local-storage.js';

let estudiantes = [];
let modal;
let editando = false;
let estudianteId = null;

document.addEventListener('DOMContentLoaded', init);

async function init() {
  modal = new bootstrap.Modal(document.getElementById('modalEstudiante'));
  document.getElementById('btnNuevoEstudiante')?.addEventListener('click', nuevo);
  document.getElementById('btnGuardarEstudiante')?.addEventListener('click', guardar);
  document.getElementById('buscarEstudiante')?.addEventListener('input', filtrar);
  await cargar();
}

function nuevo() {
  editando = false;
  estudianteId = null;
  document.getElementById('formEstudiante').reset();
  modal.show();
}

async function guardar() {
  const datos = {
    nombre: document.getElementById('nombreEstudiante').value.trim(),
    curso: document.getElementById('cursoEstudiante').value.trim(),
    tipoDisgrafia: document.getElementById('tipoDisgrafia').value,
    observaciones: document.getElementById('observacionesEstudiante').value.trim()
  };

  if (!datos.nombre || !datos.curso) return alert('Completa los campos obligatorios.');

  if (editando) {
    await actualizarEstudiante(estudianteId, datos);
  } else {
    await crearEstudiante(datos);
  }

  guardarLocal('estudiantes.filtro', '');
  modal.hide();
  await cargar();
}

async function cargar() {
  estudiantes = await listarEstudiantes();
  render(estudiantes);
}

function render(lista) {
  const cont = document.getElementById('contenedorEstudiantes');
  if (!lista.length) {
    cont.innerHTML = '<div class="col-12"><div class="empty-state"><i class="bi bi-mortarboard"></i><h4>No hay estudiantes registrados</h4></div></div>';
    return;
  }

  cont.innerHTML = lista.map((e) => `
    <div class="col-md-6 col-xl-4">
      <article class="student-card" aria-label="Perfil de ${e.nombre}">
        <h5>${e.nombre}</h5>
        <div class="meta">Curso: ${e.curso}</div>
        <div class="meta">Disgrafía: ${e.tipoDisgrafia || 'No registrada'}</div>
        <p class="mt-2 mb-0">${e.observaciones || 'Sin observaciones'}</p>
        <div class="student-actions">
          <button class="btn btn-outline-warning btn-sm" data-action="edit" data-id="${e.id}">Editar</button>
          <button class="btn btn-outline-danger btn-sm" data-action="delete" data-id="${e.id}">Eliminar</button>
        </div>
      </article>
    </div>
  `).join('');

  cont.querySelectorAll('[data-action="edit"]').forEach((btn) => btn.addEventListener('click', () => editar(btn.dataset.id)));
  cont.querySelectorAll('[data-action="delete"]').forEach((btn) => btn.addEventListener('click', () => borrar(btn.dataset.id)));
}

function filtrar(e) {
  const term = e.target.value.toLowerCase();
  guardarLocal('estudiantes.filtro', term);
  render(estudiantes.filter((item) => `${item.nombre} ${item.curso}`.toLowerCase().includes(term)));
}

async function editar(id) {
  const registro = await obtenerEstudiante(id);
  if (!registro) return;
  editando = true;
  estudianteId = id;
  document.getElementById('nombreEstudiante').value = registro.nombre || '';
  document.getElementById('cursoEstudiante').value = registro.curso || '';
  document.getElementById('tipoDisgrafia').value = registro.tipoDisgrafia || 'motora';
  document.getElementById('observacionesEstudiante').value = registro.observaciones || '';
  modal.show();
}

async function borrar(id) {
  if (!confirm('¿Eliminar estudiante?')) return;
  await eliminarEstudiante(id);
  await cargar();
}
