// Dashboard logic
console.log('Dashboard cargado');

document.addEventListener('DOMContentLoaded', function() {
  // Actualizar datos del dashboard
  const totalEst = document.getElementById('totalEstudiantes');
  const totalCurs = document.getElementById('totalCursos');
  const totalEval = document.getElementById('totalEvaluaciones');
  const totalGu = document.getElementById('totalGuias');

  if (totalEst) totalEst.textContent = localStorage.getItem('estudiantes') ? JSON.parse(localStorage.getItem('estudiantes')).length : '0';
  if (totalCurs) totalCurs.textContent = '0';
  if (totalEval) totalEval.textContent = '0';
  if (totalGu) totalGu.textContent = '0';

  // Actualizar fecha
  const hoy = new Date();
  if (document.getElementById('diaActual')) {
    document.getElementById('diaActual').textContent = hoy.getDate();
    document.getElementById('mesActual').textContent = hoy.toLocaleDateString('es-ES', { month: 'long' });
    document.getElementById('anioActual').textContent = hoy.getFullYear();
  }
});