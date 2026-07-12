let estudiantes = [];

function cargarEstudiantes() {
  estudiantes = JSON.parse(localStorage.getItem('estudiantes')) || [];
  renderizarTabla();
}

function renderizarTabla() {
  const tabla = document.getElementById('tablaEstudiantes');
  
  if (estudiantes.length === 0) {
    tabla.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No hay estudiantes registrados</td></tr>';
    return;
  }

  tabla.innerHTML = estudiantes.map(est => `
    <tr>
      <td><strong>${est.nombre}</strong></td>
      <td>${est.nivel}</td>
      <td><span class="badge bg-info">${est.disgrafia}</span></td>
      <td>-</td>
      <td>
        <button class="btn btn-sm btn-outline-primary" onclick="editarEstudiante(${est.id})">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger" onclick="eliminarEstudiante(${est.id})">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

function guardarEstudiante() {
  const nombre = document.getElementById('nombreEst').value;
  const nivel = document.getElementById('nivelEst').value;
  const disgrafia = document.getElementById('disgrafia').value;

  if (!nombre) return alert('Completa los campos');

  const nuevo = {
    id: Date.now(),
    nombre,
    nivel,
    disgrafia,
    fechaRegistro: new Date().toLocaleDateString()
  };

  estudiantes.push(nuevo);
  localStorage.setItem('estudiantes', JSON.stringify(estudiantes));
  
  document.getElementById('formEstudiante').reset();
  bootstrap.Modal.getInstance(document.getElementById('modalEstudiante')).hide();
  cargarEstudiantes();
  alert('✅ Estudiante guardado');
}

function eliminarEstudiante(id) {
  if (confirm('¿Eliminar estudiante?')) {
    estudiantes = estudiantes.filter(e => e.id !== id);
    localStorage.setItem('estudiantes', JSON.stringify(estudiantes));
    cargarEstudiantes();
  }
}

function editarEstudiante(id) {
  alert('Función de edición en desarrollo');
}

// Filtros
document.addEventListener('DOMContentLoaded', () => {
  cargarEstudiantes();
  
  document.getElementById('filtroEstudiante')?.addEventListener('keyup', () => {
    renderizarTabla();
  });
});