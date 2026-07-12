const STORAGE_KEY = 'admin.instituciones';
let instituciones = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
const body = document.getElementById('institucionesBody');

function persistir() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(instituciones));
}

function render() {
  body.innerHTML = instituciones.map((i) => `
    <tr>
      <td>${i.nombre}</td><td>${i.ciudad}</td><td>${i.pais}</td><td>${i.email}</td><td>${i.plan}</td>
      <td><button data-id="${i.id}">Eliminar</button></td>
    </tr>
  `).join('');
}

document.getElementById('formInstitucion').addEventListener('submit', (e) => {
  e.preventDefault();
  const data = new FormData(e.currentTarget);
  instituciones.unshift({
    id: crypto.randomUUID(),
    nombre: String(data.get('nombre')).trim(),
    ciudad: String(data.get('ciudad')).trim(),
    pais: String(data.get('pais')).trim(),
    email: String(data.get('email')).trim().toLowerCase(),
    plan: String(data.get('plan')).trim()
  });
  persistir();
  e.currentTarget.reset();
  render();
});

body.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-id]');
  if (!btn) return;
  instituciones = instituciones.filter((i) => i.id !== btn.dataset.id);
  persistir();
  render();
});

render();
