import { crearGuia, listarGuias, actualizarGuia, eliminarGuia, obtenerGuia } from '../../firebase/firestore.js';
import { exportarHtmlComoPdf } from '../../js/modules/pdf.js';

let guias = [];
let modal;
let editando = false;
let guiaId = null;

document.addEventListener('DOMContentLoaded', init);

async function init() {
  modal = new bootstrap.Modal(document.getElementById('modalGuia'));
  document.getElementById('btnNuevaGuia')?.addEventListener('click', nuevaGuia);
  document.getElementById('btnGuardarGuia')?.addEventListener('click', guardarGuia);
  document.getElementById('filtroTipo')?.addEventListener('change', aplicarFiltros);
  document.getElementById('filtroNivel')?.addEventListener('change', aplicarFiltros);
  document.getElementById('btnExportarGuias')?.addEventListener('click', exportar);
  await cargar();
}

function nuevaGuia() {
  editando = false;
  guiaId = null;
  document.getElementById('formGuia').reset();
  modal.show();
}

async function guardarGuia() {
  const datos = {
    titulo: document.getElementById('tituloGuia').value.trim(),
    tipo: document.getElementById('tipoGuia').value,
    nivel: document.getElementById('nivelGuia').value,
    descripcion: document.getElementById('descripcionGuia').value.trim()
  };
  if (!datos.titulo) return alert('El título es obligatorio.');

  if (editando) await actualizarGuia(guiaId, datos);
  else await crearGuia(datos);

  modal.hide();
  await cargar();
}

async function cargar() {
  guias = await listarGuias();
  render(guias);
}

function aplicarFiltros() {
  const tipo = document.getElementById('filtroTipo').value;
  const nivel = document.getElementById('filtroNivel').value;
  render(guias.filter((g) => (!tipo || g.tipo === tipo) && (!nivel || g.nivel === nivel)));
}

function render(lista) {
  const cont = document.getElementById('contenedorGuias');
  if (!lista.length) {
    cont.innerHTML = '<div class="col-12"><div class="empty-state"><i class="bi bi-journal"></i><h4>No hay guías disponibles</h4></div></div>';
    return;
  }

  cont.innerHTML = lista.map((g) => `
    <div class="col-md-6 col-xl-4">
      <article class="guia-card">
        <h5>${g.titulo}</h5>
        <p>${g.descripcion || 'Sin descripción'}</p>
        <div class="guia-tags">
          <span class="metric-badge">${g.tipo}</span>
          <span class="metric-badge">${g.nivel}</span>
        </div>
        <div class="student-actions mt-3">
          <button class="btn btn-outline-warning btn-sm" data-action="edit" data-id="${g.id}">Editar</button>
          <button class="btn btn-outline-danger btn-sm" data-action="delete" data-id="${g.id}">Eliminar</button>
        </div>
      </article>
    </div>
  `).join('');

  cont.querySelectorAll('[data-action="edit"]').forEach((btn) => btn.addEventListener('click', () => editar(btn.dataset.id)));
  cont.querySelectorAll('[data-action="delete"]').forEach((btn) => btn.addEventListener('click', () => borrar(btn.dataset.id)));
}

async function editar(id) {
  const guia = await obtenerGuia(id);
  if (!guia) return;
  editando = true;
  guiaId = id;
  document.getElementById('tituloGuia').value = guia.titulo || '';
  document.getElementById('tipoGuia').value = guia.tipo || 'motora';
  document.getElementById('nivelGuia').value = guia.nivel || 'Inicial';
  document.getElementById('descripcionGuia').value = guia.descripcion || '';
  modal.show();
}

async function borrar(id) {
  if (!confirm('¿Eliminar guía?')) return;
  await eliminarGuia(id);
  await cargar();
}

function exportar() {
  const html = guias.map((g) => `<div class="item"><strong>${g.titulo}</strong><br>Tipo: ${g.tipo} | Nivel: ${g.nivel}<br>${g.descripcion || ''}</div>`).join('');
  exportarHtmlComoPdf('Reporte de guías metodológicas', html || '<p>No hay registros.</p>');
}
