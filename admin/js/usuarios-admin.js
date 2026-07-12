const STORAGE_KEY = 'admin.usuarios';
let usuarios = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
if (!usuarios.length) {
  usuarios = [
    { id: crypto.randomUUID(), nombre: 'Admin SIGEDIS', email: 'admin@sigedis.ec', rol: 'admin', estado: 'activo', institucion: 'Mineduc' },
    { id: crypto.randomUUID(), nombre: 'Docente Demo', email: 'docente@sigedis.ec', rol: 'docente', estado: 'activo', institucion: 'UE Centro' }
  ];
}

const body = document.getElementById('usuariosBody');
const selectAll = document.getElementById('selectAll');

function persistir() { localStorage.setItem(STORAGE_KEY, JSON.stringify(usuarios)); }
function escapeHtml(valor) {
  return String(valor).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function filtrarLista() {
  const q = document.getElementById('searchUsuario').value.trim().toLowerCase();
  const rol = document.getElementById('filtroRol').value;
  const estado = document.getElementById('filtroEstado').value;
  return usuarios.filter((u) =>
    (!q || `${u.nombre} ${u.email}`.toLowerCase().includes(q)) &&
    (!rol || u.rol === rol) &&
    (!estado || u.estado === estado)
  );
}

function render() {
  body.innerHTML = filtrarLista().map((u) => `
    <tr>
      <td><input class="row-select" type="checkbox" value="${u.id}" /></td>
      <td>${escapeHtml(u.nombre)}</td><td>${escapeHtml(u.email)}</td><td>${u.rol}</td><td>${u.estado}</td><td>${escapeHtml(u.institucion)}</td>
      <td>
        <button data-action="toggle" data-id="${u.id}">${u.estado === 'activo' ? 'Bloquear' : 'Desbloquear'}</button>
        <button data-action="delete" data-id="${u.id}">Eliminar</button>
      </td>
    </tr>
  `).join('');
}

function seleccionados() {
  return Array.from(document.querySelectorAll('.row-select:checked')).map((x) => x.value);
}

body.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-id]');
  if (!btn) return;
  const { id, action } = btn.dataset;
  if (action === 'toggle') usuarios = usuarios.map((u) => u.id === id ? { ...u, estado: u.estado === 'activo' ? 'bloqueado' : 'activo' } : u);
  if (action === 'delete') usuarios = usuarios.filter((u) => u.id !== id);
  persistir();
  render();
});

selectAll.addEventListener('change', () => {
  document.querySelectorAll('.row-select').forEach((check) => { check.checked = selectAll.checked; });
});

document.getElementById('bulkBloquear').addEventListener('click', () => {
  const ids = new Set(seleccionados());
  usuarios = usuarios.map((u) => ids.has(u.id) ? { ...u, estado: 'bloqueado' } : u);
  persistir();
  render();
});

document.getElementById('bulkEliminar').addEventListener('click', () => {
  const ids = new Set(seleccionados());
  usuarios = usuarios.filter((u) => !ids.has(u.id));
  persistir();
  render();
});

['searchUsuario', 'filtroRol', 'filtroEstado'].forEach((id) => {
  document.getElementById(id).addEventListener('input', render);
  document.getElementById(id).addEventListener('change', render);
});

persistir();
render();
