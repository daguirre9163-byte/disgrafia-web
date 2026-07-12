import {
  obtenerRecursosServicio,
  crearRecursoServicio,
  actualizarRecursoServicio,
  eliminarRecursoServicio
} from './recursos-service.js';

import { sanitizarTexto } from '../../js/validaciones.js';
import { registrarNotificacion } from '../../js/notificaciones.js';
import { auth } from '../../firebase/firebase-config.js';

let recursos = [];
let recursoEditandoId = null;
let modalRecurso = null;

function getModal() {
  if (!modalRecurso) {
    modalRecurso = new bootstrap.Modal(document.getElementById('modalRecurso'));
  }
  return modalRecurso;
}

function actualizarCampos() {
  const tipo = document.getElementById('tipoRecursoForm').value;
  const campoURL = document.getElementById('campoURL');
  const campoArchivo = document.getElementById('campoArchivo');

  if (tipo === 'pdf' || tipo === 'ejercicio') {
    campoArchivo.style.display = 'flex';
    campoURL.style.display = 'none';
    document.getElementById('archivoRecurso').required = true;
    document.getElementById('urlRecurso').required = false;
  } else {
    campoArchivo.style.display = 'none';
    campoURL.style.display = 'flex';
    document.getElementById('archivoRecurso').required = false;
    document.getElementById('urlRecurso').required = true;
  }
}

function filtrarLista() {
  const texto = document.getElementById('buscarRecurso')?.value?.toLowerCase() || '';
  const tipo = document.getElementById('filtroTipoRecurso')?.value?.toLowerCase() || '';
  const disgrafia = document.getElementById('filtroDisgrafiaRecurso')?.value?.toLowerCase() || '';
  const nivel = document.getElementById('filtroNivelRecurso')?.value?.toLowerCase() || '';

  return recursos.filter((recurso) => {
    const coincideNombre = recurso.nombre.toLowerCase().includes(texto);
    const coincideTipo = !tipo || recurso.tipo.toLowerCase().includes(tipo);
    const coincideDisgrafia = !disgrafia || recurso.disgrafia.toLowerCase().includes(disgrafia);
    const coincideNivel = !nivel || recurso.nivel.toLowerCase().includes(nivel);
    const esPublico = !recurso.publico || auth.currentUser?.uid === recurso.creadoPor || true;

    return coincideNombre && coincideTipo && coincideDisgrafia && coincideNivel && esPublico;
  });
}

function renderizarGaleria() {
  const galeria = document.getElementById('galeriaRecursos');
  const lista = filtrarLista();

  if (!lista.length) {
    galeria.innerHTML = '<div class="col-12 text-center text-muted"><p>No hay recursos disponibles con esos filtros</p></div>';
    return;
  }

  galeria.innerHTML = lista.map((recurso) => {
    const icono = {
      'pdf': '📄',
      'video': '🎥',
      'herramienta': '🛠️',
      'ejercicio': '✏️'
    }[recurso.tipo] || '📦';

    const badge = {
      'pdf': 'bg-secondary',
      'video': 'bg-danger',
      'herramienta': 'bg-success',
      'ejercicio': 'bg-warning'
    }[recurso.tipo] || 'bg-secondary';

    return `
      <div class="col-md-4">
        <div class="card h-100 border-0 shadow-sm">
          <div class="card-body">
            <div class="mb-2">
              <span class="h3">${icono}</span>
            </div>
            <h6 class="card-title">${sanitizarTexto(recurso.nombre)}</h6>
            <p class="small text-muted mb-2">${sanitizarTexto(recurso.descripcion || 'Sin descripción')}</p>
            <div class="mb-3">
              <span class="badge ${badge}">${recurso.tipo}</span>
              <span class="badge bg-info">${recurso.disgrafia}</span>
              <span class="badge bg-primary">${recurso.nivel}</span>
            </div>
            <div class="d-flex gap-2">
              <a href="${recurso.url}" target="_blank" class="btn btn-sm btn-outline-primary flex-grow-1">
                <i class="bi bi-download"></i> Acceder
              </a>
              ${auth.currentUser?.uid === recurso.creadoPor ? `
                <button class="btn btn-sm btn-outline-warning" onclick="editarRecurso('${recurso.id}')">
                  <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="eliminarRecurso('${recurso.id}')">
                  <i class="bi bi-trash"></i>
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

async function cargarRecursos() {
  recursos = await obtenerRecursosServicio();
  renderizarGaleria();
}

function limpiarFormulario() {
  const form = document.getElementById('formRecurso');
  if (form) form.reset();
  recursoEditandoId = null;
  document.getElementById('tipoRecursoForm').value = '';
  actualizarCampos();
}

async function guardarRecurso() {
  const nombre = sanitizarTexto(document.getElementById('nombreRecurso')?.value);
  const descripcion = sanitizarTexto(document.getElementById('descripcionRecurso')?.value);
  const tipo = document.getElementById('tipoRecursoForm')?.value;
  const disgrafia = document.getElementById('disgrafiaRecursoForm')?.value;
  const nivel = document.getElementById('nivelRecursoForm')?.value;
  const url = document.getElementById('urlRecurso')?.value;
  const publico = document.getElementById('publicoRecurso')?.checked || true;

  if (!nombre || !tipo || !disgrafia || !nivel) {
    await registrarNotificacion({ mensaje: 'Completa los campos obligatorios', tipo: 'danger' });
    return;
  }

  const payload = {
    nombre,
    descripcion,
    tipo,
    disgrafia,
    nivel,
    url,
    publico,
    creadoPor: auth.currentUser?.uid
  };

  if (recursoEditandoId) {
    await actualizarRecursoServicio(recursoEditandoId, payload);
    await registrarNotificacion({ mensaje: 'Recurso actualizado', tipo: 'success' });
  } else {
    await crearRecursoServicio(payload);
    await registrarNotificacion({ mensaje: 'Recurso creado correctamente', tipo: 'success' });
  }

  limpiarFormulario();
  getModal().hide();
  await cargarRecursos();
}

async function eliminarRecurso(id) {
  if (!confirm('¿Eliminar este recurso?')) return;

  await eliminarRecursoServicio(id);
  await registrarNotificacion({ mensaje: 'Recurso eliminado', tipo: 'warning' });
  await cargarRecursos();
}

async function editarRecurso(id) {
  const recurso = recursos.find(r => r.id === id);
  if (!recurso) return;

  recursoEditandoId = id;
  document.getElementById('nombreRecurso').value = recurso.nombre || '';
  document.getElementById('descripcionRecurso').value = recurso.descripcion || '';
  document.getElementById('tipoRecursoForm').value = recurso.tipo || '';
  document.getElementById('disgrafiaRecursoForm').value = recurso.disgrafia || '';
  document.getElementById('nivelRecursoForm').value = recurso.nivel || '';
  document.getElementById('urlRecurso').value = recurso.url || '';
  document.getElementById('publicoRecurso').checked = recurso.publico !== false;
  
  actualizarCampos();
  getModal().show();
}

async function initRecursos() {
  document.getElementById('buscarRecurso')?.addEventListener('input', renderizarGaleria);
  document.getElementById('filtroTipoRecurso')?.addEventListener('change', renderizarGaleria);
  document.getElementById('filtroDisgrafiaRecurso')?.addEventListener('change', renderizarGaleria);
  document.getElementById('filtroNivelRecurso')?.addEventListener('change', renderizarGaleria);

  await cargarRecursos();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initRecursos);
} else {
  initRecursos();
}

window.guardarRecurso = guardarRecurso;
window.eliminarRecurso = eliminarRecurso;
window.editarRecurso = editarRecurso;
window.actualizarCampos = actualizarCampos;