const STORAGE_KEY = 'admin.docentes';

const docentesIniciales = [
  { id: crypto.randomUUID(), nombre: 'Ana Pérez', email: 'ana@colegio.edu.ec', institucion: 'Unidad Educativa Centro', estado: 'activo', estudiantes: 24, evaluaciones: 89, rol: 'docente' }
];

const cargar = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || docentesIniciales;
const guardar = (lista) => localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));

let docentes = cargar();
const body = document.getElementById('docentesBody');

function render() {
  body.innerHTML = docentes.map((d) => `
    <tr>
      <td>${d.nombre}</td><td>${d.email}</td><td>${d.institucion}</td><td>${d.estado}</td>
      <td>${d.estudiantes}</td><td>${d.evaluaciones}</td>
      <td>
        <button data-action="toggle" data-id="${d.id}">${d.estado === 'activo' ? 'Bloquear' : 'Activar'}</button>
        <button data-action="delete" data-id="${d.id}">Eliminar</button>
      </td>
    </tr>
  `).join('');
}

body.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-id]');
  if (!btn) return;
  const { id, action } = btn.dataset;
  if (action === 'toggle') {
    docentes = docentes.map((d) => d.id === id ? { ...d, estado: d.estado === 'activo' ? 'bloqueado' : 'activo' } : d);
  }
  if (action === 'delete') {
    docentes = docentes.filter((d) => d.id !== id);
  }
  guardar(docentes);
  render();
});

document.getElementById('formDocente').addEventListener('submit', (e) => {
  e.preventDefault();
  const form = new FormData(e.currentTarget);
  const email = String(form.get('email')).trim().toLowerCase();
  if (docentes.some((d) => d.email.toLowerCase() === email)) {
    alert('El email ya existe');
    return;
  }
  docentes.unshift({
    id: crypto.randomUUID(),
    nombre: String(form.get('nombre')).trim(),
    email,
    institucion: String(form.get('institucion')).trim(),
    estado: 'activo',
    estudiantes: 0,
    evaluaciones: 0,
    rol: String(form.get('rol')).trim()
  });
  guardar(docentes);
  e.currentTarget.reset();
  render();
});

render();
