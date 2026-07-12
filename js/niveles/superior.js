import { guardarLocal, leerLocal } from '../modules/local-storage.js';

const CLAVE = 'niveles.superior.completadas';

const actividades = [
  { titulo: 'Motricidad fina guiada', objetivo: 'Fortalecer trazos y coordinación visomotora.' },
  { titulo: 'Dictado estructurado', objetivo: 'Practicar segmentación y control espacial de la escritura.' },
  { titulo: 'Autoevaluación y retroalimentación', objetivo: 'Registrar avances y dificultades para seguimiento docente.' }
];

const completadas = new Set(leerLocal(CLAVE, []));
const contenedor = document.getElementById('actividadesNivel');

contenedor.innerHTML = actividades.map((actividad, index) => {
  const id = 'superior-' + index;
  const marcada = completadas.has(id);
  return     '<article class="panel mb-3">' +
      '<div class="d-flex justify-content-between align-items-start gap-3">' +
        '<div>' +
          '<h2 class="h5 mb-1">' + actividad.titulo + '</h2>' +
          '<p class="mb-0 text-muted">' + actividad.objetivo + '</p>' +
        '</div>' +
        '<button class="btn btn-sm ' + (marcada ? 'btn-success' : 'btn-outline-primary') + '" data-id="' + id + '">' +
          (marcada ? 'Completada' : 'Marcar') +
        '</button>' +
      '</div>' +
    '</article>';
}).join('');

contenedor.querySelectorAll('button[data-id]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const id = btn.dataset.id;
    if (completadas.has(id)) {
      completadas.delete(id);
      btn.className = 'btn btn-sm btn-outline-primary';
      btn.textContent = 'Marcar';
    } else {
      completadas.add(id);
      btn.className = 'btn btn-sm btn-success';
      btn.textContent = 'Completada';
    }
    guardarLocal(CLAVE, Array.from(completadas));
  });
});
