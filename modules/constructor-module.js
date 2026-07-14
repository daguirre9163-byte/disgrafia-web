import { obtenerTiposDisgrafia } from '../services/disgrafia-service.js';
import {
  crearPlan,
  obtenerObjetivos,
  generarActividades,
  guardarPlan,
  obtenerPlanesUsuario,
  actualizarPlan,
  eliminarPlan
} from '../services/planes-service.js';

const estado = {
  editandoId: null,
  actividades: []
};

function getObjetivosSeleccionados() {
  return Array.from(document.querySelectorAll('input[name="objetivo"]:checked')).map((item) => item.value);
}

function renderActividades() {
  const lista = document.getElementById('listaActividades');
  if (!lista) return;

  if (!estado.actividades.length) {
    lista.innerHTML = '<div class="list-group-item text-muted">Sin actividades generadas.</div>';
    return;
  }

  lista.innerHTML = estado.actividades.map((item) => `
    <div class="list-group-item">
      <strong>${item.actividad}</strong>
      <div class="small text-muted">Objetivo: ${item.objetivo}</div>
      <div class="small">Duración: ${item.duracion} · Frecuencia: ${item.frecuencia}</div>
      <div class="small text-muted">Recursos: ${item.recursos.join(', ')}</div>
    </div>
  `).join('');
}

function renderVistaPrevia() {
  const vista = document.getElementById('vistaPreviaPlan');
  if (!vista) return;

  const nombre = document.getElementById('nombrePlan')?.value || 'Sin nombre';
  const tipo = document.getElementById('tipoDisgrafia')?.value || 'Sin tipo';
  const objetivos = getObjetivosSeleccionados();

  vista.innerHTML = `
    <h2 class="h6">${nombre}</h2>
    <p class="mb-2"><strong>Tipo:</strong> ${tipo}</p>
    <p class="mb-2"><strong>Objetivos (${objetivos.length}):</strong> ${objetivos.join(', ') || 'Sin selección'}</p>
    <p class="mb-0"><strong>Actividades:</strong> ${estado.actividades.length}</p>
  `;
}

async function cargarObjetivosPorTipo(tipo) {
  const contenedor = document.getElementById('contenedorObjetivos');
  if (!contenedor) return;

  const objetivos = await obtenerObjetivos(tipo);
  if (!objetivos.length) {
    contenedor.innerHTML = '<p class="mb-0 text-muted">No hay objetivos configurados para este tipo.</p>';
    return;
  }

  contenedor.innerHTML = objetivos.map((objetivo, idx) => `
    <div class="form-check">
      <input class="form-check-input" type="checkbox" name="objetivo" id="obj-${idx}" value="${objetivo}">
      <label class="form-check-label" for="obj-${idx}">${objetivo}</label>
    </div>
  `).join('');

  contenedor.querySelectorAll('input[name="objetivo"]').forEach((input) => {
    input.addEventListener('change', renderVistaPrevia);
  });
}

async function cargarTipos() {
  const select = document.getElementById('tipoDisgrafia');
  if (!select) return;

  const tipos = await obtenerTiposDisgrafia();
  select.innerHTML = '<option value="">Selecciona un tipo</option>' + tipos.map((item) => {
    return `<option value="${item.tipo}">${item.tipo}</option>`;
  }).join('');

  select.addEventListener('change', async (event) => {
    estado.actividades = [];
    renderActividades();
    await cargarObjetivosPorTipo(event.target.value);
    renderVistaPrevia();
  });
}

async function guardarDesdeFormulario(event) {
  event.preventDefault();

  const base = {
    nombre: document.getElementById('nombrePlan')?.value.trim(),
    nombrePlan: document.getElementById('nombrePlan')?.value.trim(),
    estudianteId: document.getElementById('estudianteId')?.value.trim(),
    tipoDisgrafia: document.getElementById('tipoDisgrafia')?.value,
    fechaInicio: document.getElementById('fechaInicio')?.value,
    objetivos: getObjetivosSeleccionados(),
    actividades: estado.actividades
  };

  const plan = await crearPlan(base);

  if (estado.editandoId) {
    await actualizarPlan(estado.editandoId, plan);
  } else {
    await guardarPlan(plan);
  }

  event.target.reset();
  estado.editandoId = null;
  estado.actividades = [];
  renderActividades();
  renderVistaPrevia();
  await cargarTablaPlanes();
}

async function cargarTablaPlanes() {
  const tbody = document.getElementById('tablaPlanes');
  if (!tbody) return;

  const planes = await obtenerPlanesUsuario();
  if (!planes.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Sin planes guardados.</td></tr>';
    return;
  }

  tbody.innerHTML = planes.map((plan) => `
    <tr>
      <td>${plan.nombre || plan.nombrePlan}</td>
      <td>${plan.tipoDisgrafia || '-'}</td>
      <td>${(plan.objetivos || []).length}</td>
      <td>${(plan.actividades || []).length}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary" data-editar="${plan.id}">Editar</button>
        <button class="btn btn-sm btn-outline-danger" data-eliminar="${plan.id}">Eliminar</button>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-eliminar]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await eliminarPlan(btn.dataset.eliminar);
      await cargarTablaPlanes();
    });
  });

  tbody.querySelectorAll('[data-editar]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const plan = planes.find((item) => item.id === btn.dataset.editar);
      if (!plan) return;

      estado.editandoId = plan.id;
      document.getElementById('nombrePlan').value = plan.nombre || plan.nombrePlan || '';
      document.getElementById('estudianteId').value = plan.estudianteId || '';
      document.getElementById('tipoDisgrafia').value = plan.tipoDisgrafia || '';
      document.getElementById('fechaInicio').value = plan.fechaInicio || '';
      await cargarObjetivosPorTipo(plan.tipoDisgrafia || '');

      const objetivosSeleccionados = new Set(plan.objetivos || []);
      document.querySelectorAll('input[name="objetivo"]').forEach((input) => {
        input.checked = objetivosSeleccionados.has(input.value) || objetivosSeleccionados.has(input.descripcion);
      });

      estado.actividades = plan.actividades || [];
      renderActividades();
      renderVistaPrevia();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

async function init() {
  document.getElementById('fechaInicio').value = new Date().toISOString().split('T')[0];
  await cargarTipos();

  document.getElementById('btnGenerarActividades')?.addEventListener('click', async () => {
    const objetivos = getObjetivosSeleccionados();
    estado.actividades = await generarActividades(objetivos);
    renderActividades();
    renderVistaPrevia();
  });

  document.getElementById('btnVistaPrevia')?.addEventListener('click', renderVistaPrevia);
  document.getElementById('btnRefrescarPlanes')?.addEventListener('click', cargarTablaPlanes);
  document.getElementById('formPlan')?.addEventListener('submit', guardarDesdeFormulario);

  await cargarTablaPlanes();
  renderActividades();
  renderVistaPrevia();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
