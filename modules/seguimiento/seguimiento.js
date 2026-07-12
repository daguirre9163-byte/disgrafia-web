import { crearProgreso, listarProgreso } from '../../firebase/firestore.js';

let progreso = [];
let modal;

document.addEventListener('DOMContentLoaded', init);

async function init() {
  modal = new bootstrap.Modal(document.getElementById('modalSeguimiento'));
  document.getElementById('btnNuevoSeguimiento')?.addEventListener('click', () => modal.show());
  document.getElementById('btnGuardarSeguimiento')?.addEventListener('click', guardar);
  await cargar();
}

async function guardar() {
  const datos = {
    estudiante: document.getElementById('seguimientoEstudiante').value.trim(),
    actividad: document.getElementById('seguimientoActividad').value.trim(),
    progreso: Number(document.getElementById('seguimientoProgreso').value || 0),
    observacion: document.getElementById('seguimientoObservacion').value.trim()
  };

  if (!datos.estudiante || !datos.actividad) return alert('Completa los campos obligatorios.');
  if (datos.progreso < 0 || datos.progreso > 100) return alert('El progreso debe estar entre 0 y 100.');

  await crearProgreso(datos);
  document.getElementById('formSeguimiento').reset();
  modal.hide();
  await cargar();
}

async function cargar() {
  progreso = await listarProgreso();
  const cont = document.getElementById('contenedorSeguimiento');
  if (!progreso.length) {
    cont.innerHTML = '<div class="empty-state"><i class="bi bi-activity"></i><h4>No hay registros de seguimiento</h4></div>';
    return;
  }

  cont.innerHTML = progreso.map((item) => `
    <article class="progress-card" aria-label="Seguimiento de ${item.estudiante}">
      <h5>${item.estudiante}</h5>
      <small>${item.actividad}</small>
      <div class="progress mt-2 mb-2">
        <div class="progress-bar" role="progressbar" style="width:${item.progreso || 0}%" aria-valuenow="${item.progreso || 0}" aria-valuemin="0" aria-valuemax="100"></div>
      </div>
      <strong>${item.progreso || 0}%</strong>
      <p class="mb-0 mt-2">${item.observacion || 'Sin observaciones'}</p>
    </article>
  `).join('');
}
