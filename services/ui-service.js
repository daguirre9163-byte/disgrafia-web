export async function cargarFragmento(url, target) {
  const response = await fetch(url);
  const html = await response.text();

  if (typeof target === "string") {
    const element = document.querySelector(target);
    if (element) {
      element.innerHTML = html;
    }
  } else if (target) {
    target.innerHTML = html;
  }

  return html;
}

export function crearTarjetaResumen({ titulo, valor, icono = "bi-bar-chart", color = "primary" }) {
  return `
    <div class="card border-0 shadow-sm h-100">
      <div class="card-body d-flex align-items-center gap-3">
        <div class="rounded-circle bg-${color} bg-opacity-10 text-${color} d-inline-flex align-items-center justify-content-center" style="width:48px;height:48px;">
          <i class="bi ${icono}"></i>
        </div>
        <div>
          <p class="text-muted mb-1">${titulo}</p>
          <h4 class="mb-0">${valor}</h4>
        </div>
      </div>
    </div>`;
}

export function renderEmptyState({ icono = "bi-inbox", titulo, descripcion, accion = "" }) {
  return `
    <div class="empty-state text-center py-5">
      <i class="bi ${icono} fs-1 text-muted"></i>
      <h4 class="mt-3">${titulo}</h4>
      <p class="text-muted mb-0">${descripcion}</p>
      ${accion}
    </div>`;
}
