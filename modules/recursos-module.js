import {
  buscarRecursos,
  filtrarRecursos,
  guardarRecursoVisitado,
  obtenerRecursos
} from '../services/recursos-service.js';

const estado = {
  recursos: [],
  tipo: '',
  termino: ''
};

function escapeHtml(texto = '') {
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function construirTarjeta(recurso) {
  return `
    <article class="col-md-6 col-lg-4">
      <div class="card h-100 border-0 shadow-sm">
        <div class="card-body d-flex flex-column">
          <span class="badge text-bg-primary mb-2 align-self-start">${escapeHtml(recurso.tipo)}</span>
          <h2 class="h6">${escapeHtml(recurso.titulo)}</h2>
          <p class="text-muted small flex-grow-1">${escapeHtml(recurso.descripcion)}</p>
          <p class="small mb-2"><strong>Categoría:</strong> ${escapeHtml(recurso.categoria)}</p>
          <p class="small text-muted mb-3"><strong>Autor:</strong> ${escapeHtml(recurso.autor)}</p>
          <button class="btn btn-outline-primary btn-sm" data-id="${escapeHtml(recurso.id)}">
            <i class="bi bi-download"></i> Abrir / Descargar
          </button>
        </div>
      </div>
    </article>
  `;
}

async function renderizar() {
  const contenedor = document.getElementById('contenedorRecursos');
  const contador = document.getElementById('contadorRecursos');
  if (!contenedor || !contador) return;

  let lista = estado.recursos;
  if (estado.termino) {
    lista = await buscarRecursos(estado.termino);
  }

  if (estado.tipo) {
    const filtradosTipo = await filtrarRecursos(estado.tipo);
    const idsTipo = new Set(filtradosTipo.map((item) => String(item.id)));
    lista = lista.filter((item) => idsTipo.has(String(item.id)));
  }

  contador.textContent = `${lista.length} recurso(s) encontrados`;

  if (!lista.length) {
    contenedor.innerHTML = '<div class="col-12"><div class="alert alert-info mb-0">No hay recursos para los filtros seleccionados.</div></div>';
    return;
  }

  const tarjetas = await Promise.all(lista.map(construirTarjeta));
  contenedor.innerHTML = tarjetas.join('');

  contenedor.querySelectorAll('button[data-id]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const recurso = lista.find((item) => String(item.id) === btn.dataset.id);
      if (!recurso) return;

      await guardarRecursoVisitado(recurso);
      window.open(recurso.url, '_blank', 'noopener');
    });
  });
}

async function init() {
  estado.recursos = await obtenerRecursos();

  document.getElementById('buscarRecurso')?.addEventListener('input', async (event) => {
    estado.termino = event.target.value.trim();
    await renderizar();
  });

  document.getElementById('filtroTipo')?.addEventListener('change', async (event) => {
    estado.tipo = event.target.value;
    await renderizar();
  });

  await renderizar();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
