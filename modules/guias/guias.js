import {
  obtenerGuiasServicio,
  crearGuiaServicio,
  actualizarGuiaServicio,
  eliminarGuiaServicio
} from './guias-service.js';

import { sanitizarTexto } from '../../js/validaciones.js';
import { registrarNotificacion } from '../../js/notificaciones.js';
import { auth } from '../../firebase/firebase-config.js';

let guias = [];
let guiaEditandoId = null;
let modalGuia = null;
let pasos = [];

function getModal() {
  if (!modalGuia) {
    modalGuia = new bootstrap.Modal(document.getElementById('modalGuia'));
  }
  return modalGuia;
}

function agregarPaso() {
  const pasosList = document.getElementById('pasosList');
  const index = pasos.length;
  const paso = { numero: index + 1, titulo: '', descripcion: '', recursos: [] };
  pasos.push(paso);
  renderizarPasos();
}

function eliminarPaso(index) {
  pasos.splice(index, 1);
  pasos.forEach((p, i) => p.numero = i + 1);
  renderizarPasos();
}

function renderizarPasos() {
  const pasosList = document.getElementById('pasosList');
  pasosList.innerHTML = pasos.map((paso, index) => `
    <div class="card mb-2">
      <div class="card-body">
        <div class="row g-2">
          <div class="col-md-2">
            <label class="form-label">Paso ${paso.numero}</label>
            <input type="number" value="${paso.numero}" disabled class="form-control form-control-sm">
          </div>
          <div class="col-md-5">
            <label class="form-label">Título del paso</label>
            <input type="text" class="form-control form-control-sm" value="${paso.titulo || ''}" 
              onchange="actualizarPaso(${index}, 'titulo', this.value)" placeholder="Ej: Preparación">
          </div>
          <div class="col-md-4">
            <label class="form-label">Descripción</label>
            <textarea class="form-control form-control-sm" rows="2" placeholder="Instrucciones detalladas..."
              onchange="actualizarPaso(${index}, 'descripcion', this.value)">${paso.descripcion || ''}</textarea>
          </div>
          <div class="col-md-1 d-flex align-items-end">
            <button type="button" class="btn btn-sm btn-danger w-100" onclick="eliminarPaso(${index})">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

function actualizarPaso(index, campo, valor) {
  pasos[index][campo] = valor;
}

function filtrarLista() {
  const texto = document.getElementById('buscarGuia')?.value?.toLowerCase() || '';
  const tipo = document.getElementById('filtroTipoGuia')?.value?.toLowerCase() || '';
  const nivel = document.getElementById('filtroNivelGuia')?.value?.toLowerCase() || '';

  return guias.filter((guia) => {
    const coincideNombre = guia.titulo.toLowerCase().includes(texto);
    const coincideTipo = !tipo || guia.tipo.toLowerCase().includes(tipo);
    const coincideNivel = !nivel || guia.nivel.toLowerCase().includes(nivel);
    const esPublica = !guia.publico || auth.currentUser?.uid === guia.creadoPor || true;

    return coincideNombre && coincideTipo && coincideNivel && esPublica;
  });
}

function renderizarLista() {
  const lista = document.getElementById('listaGuias');
  const resultado = filtrarLista();

  if (!resultado.length) {
    lista.innerHTML = '<div class="col-12 text-center text-muted"><p>No hay guías disponibles con esos filtros</p></div>';
    return;
  }

  lista.innerHTML = resultado.map((guia) => `
    <div class="col-lg-6">
      <div class="card h-100 border-0 shadow-sm">
        <div class="card-body">
          <h5 class="card-title">${sanitizarTexto(guia.titulo)}</h5>
          <p class="small text-muted mb-2">${sanitizarTexto(guia.descripcion)}</p>
          
          <div class="mb-3">
            <span class="badge bg-info">${guia.tipo}</span>
            <span class="badge bg-primary">${guia.nivel}</span>
            <span class="badge bg-success">${guia.pasos?.length || 0} pasos</span>
          </div>

          <!-- PASOS RESUMEN -->
          <div class="mb-3">
            <strong class="small">Pasos:</strong>
            <ol class="mb-0 ps-3 small">
              ${(guia.pasos || []).slice(0, 3).map(p => `<li>${sanitizarTexto(p.titulo)}</li>`).join('')}
              ${guia.pasos?.length > 3 ? `<li>... y ${guia.pasos.length - 3} más</li>` : ''}
            </ol>
          </div>

          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-outline-primary flex-grow-1" onclick="verDetalles('${guia.id}')">
              <i class="bi bi-eye"></i> Ver Detalles
            </button>
            ${auth.currentUser?.uid === guia.creadoPor ? `
              <button class="btn btn-sm btn-outline-warning" onclick="editarGuia('${guia.id}')">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-sm btn-outline-danger" onclick="eliminarGuia('${guia.id}')">
                <i class="bi bi-trash"></i>
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

async function cargarGuias() {
  guias = await obtenerGuiasServicio();
  renderizarLista();
}

function limpiarFormulario() {
  const form = document.getElementById('formGuia');
  if (form) form.reset();
  guiaEditandoId = null;
  pasos = [];
  renderizarPasos();
}

async function guardarGuia() {
  const titulo = sanitizarTexto(document.getElementById('tituloGuia')?.value);
  const descripcion = sanitizarTexto(document.getElementById('descripcionGuia')?.value);
  const tipo = document.getElementById('tipoDisgrafiaGuia')?.value;
  const nivel = document.getElementById('nivelGuia')?.value;
  const publico = document.getElementById('publicoGuia')?.checked || true;

  if (!titulo || !descripcion || !tipo || !nivel || pasos.length === 0) {
    await registrarNotificacion({ mensaje: 'Completa todos los campos y agrega al menos un paso', tipo: 'danger' });
    return;
  }

  const payload = {
    titulo,
    descripcion,
    tipo,
    nivel,
    pasos,
    publico,
    creadoPor: auth.currentUser?.uid
  };

  if (guiaEditandoId) {
    await actualizarGuiaServicio(guiaEditandoId, payload);
    await registrarNotificacion({ mensaje: 'Guía actualizada', tipo: 'success' });
  } else {
    await crearGuiaServicio(payload);
    await registrarNotificacion({ mensaje: 'Guía creada correctamente', tipo: 'success' });
  }

  limpiarFormulario();
  getModal().hide();
  await cargarGuias();
}

async function eliminarGuia(id) {
  if (!confirm('¿Eliminar esta guía?')) return;

  await eliminarGuiaServicio(id);
  await registrarNotificacion({ mensaje: 'Guía eliminada', tipo: 'warning' });
  await cargarGuias();
}

async function editarGuia(id) {
  const guia = guias.find(g => g.id === id);
  if (!guia) return;

  guiaEditandoId = id;
  document.getElementById('tituloGuia').value = guia.titulo || '';
  document.getElementById('descripcionGuia').value = guia.descripcion || '';
  document.getElementById('tipoDisgrafiaGuia').value = guia.tipo || '';
  document.getElementById('nivelGuia').value = guia.nivel || '';
  document.getElementById('publicoGuia').checked = guia.publico !== false;
  
  pasos = guia.pasos ? JSON.parse(JSON.stringify(guia.pasos)) : [];
  renderizarPasos();
  getModal().show();
}

function verDetalles(id) {
  const guia = guias.find(g => g.id === id);
  if (!guia) return;

  const html = `
    <div class="modal fade" id="modalDetalles" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">${sanitizarTexto(guia.titulo)}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <p><strong>Descripción:</strong> ${sanitizarTexto(guia.descripcion)}</p>
            <p><strong>Tipo:</strong> ${guia.tipo} | <strong>Nivel:</strong> ${guia.nivel}</p>
            
            <h6 class="mt-4">Pasos Metodológicos:</h6>
            <ol>
              ${(guia.pasos || []).map(p => `
                <li>
                  <strong>${sanitizarTexto(p.titulo)}</strong><br>
                  <small>${sanitizarTexto(p.descripcion)}</small>
                </li>
              `).join('')}
            </ol>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', html);
  new bootstrap.Modal(document.getElementById('modalDetalles')).show();
}

async function initGuias() {
  document.getElementById('buscarGuia')?.addEventListener('input', renderizarLista);
  document.getElementById('filtroTipoGuia')?.addEventListener('change', renderizarLista);
  document.getElementById('filtroNivelGuia')?.addEventListener('change', renderizarLista);

  await cargarGuias();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGuias);
} else {
  initGuias();
}

window.guardarGuia = guardarGuia;
window.eliminarGuia = eliminarGuia;
window.editarGuia = editarGuia;
window.verDetalles = verDetalles;
window.agregarPaso = agregarPaso;
window.eliminarPaso = eliminarPaso;
window.actualizarPaso = actualizarPaso;