const metricas = {
  docentesActivos: 42,
  estudiantes: 318,
  evaluacionesHoy: 27,
  evaluacionesMes: 510,
  tasaUso: '78%',
  docentesNuevos7d: 6,
  instituciones: 12
};

const alertas = [
  { alerta: 'Docentes sin actividad >30 días', tipo: 'actividad', estado: 'pendiente' },
  { alerta: 'Estudiantes con promedio < 4.0', tipo: 'rendimiento', estado: 'atención' },
  { alerta: 'Errores del sistema (última hora)', tipo: 'logs', estado: 'normal' },
  { alerta: 'Cuota de almacenamiento al 82%', tipo: 'capacidad', estado: 'advertencia' }
];

document.getElementById('metricas').innerHTML = Object.entries(metricas)
  .map(([k, v]) => `<article class="card"><small>${k}</small><h3>${v}</h3></article>`)
  .join('');

document.getElementById('alertasBody').innerHTML = alertas
  .map((a) => `<tr><td>${a.alerta}</td><td>${a.tipo}</td><td>${a.estado}</td></tr>`)
  .join('');

const horas = Array.from({ length: 24 }, (_, h) => ({ hora: h, valor: Math.floor(Math.random() * 20) + 1 }));
document.getElementById('heatmapHoras').innerHTML = `<div style="display:grid;grid-template-columns:repeat(8,1fr);gap:.35rem;">${horas
  .map(({ hora, valor }) => `<div title="${hora}:00" style="background:rgba(13,110,253,${Math.max(valor / 20, 0.15)});color:#fff;padding:.5rem;border-radius:.45rem;text-align:center;">${hora}</div>`)
  .join('')}</div>`;

const chartCtx = document.getElementById('crecimientoChart');
if (chartCtx && window.Chart) {
  new Chart(chartCtx, {
    type: 'line',
    data: {
      labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
      datasets: [{ label: 'Usuarios activos', data: [120, 160, 210, 250, 300, 360], borderColor: '#0d6efd' }]
    },
    options: { responsive: true }
  });
}
