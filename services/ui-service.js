function escaparHTML(valor = "") {
  return String(valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizarHTMLPermitido(html = "") {
  const template = document.createElement("template");
  template.innerHTML = String(html);
  const atributosURL = new Set(["href", "src", "xlink:href", "action", "formaction", "poster"]);
  const protocolosPermitidos = new Set(["http:", "https:", "mailto:", "tel:"]);

  template.content.querySelectorAll("script, style, iframe, object, embed, link, meta").forEach((node) => node.remove());
  template.content.querySelectorAll("*").forEach((node) => {
    [...node.attributes].forEach((attr) => {
      const nombre = attr.name.toLowerCase();
      const valorOriginal = attr.value.trim();
      const valor = valorOriginal.toLowerCase();

      if (nombre.startsWith("on") || nombre === "style") {
        node.removeAttribute(attr.name);
        return;
      }

      if (!atributosURL.has(nombre)) {
        return;
      }

      if (!valorOriginal || valorOriginal.startsWith("#") || valorOriginal.startsWith("/") || valorOriginal.startsWith("./") || valorOriginal.startsWith("../")) {
        return;
      }

      try {
        const url = new URL(valorOriginal, window.location.origin);
        if (!protocolosPermitidos.has(url.protocol)) {
          node.removeAttribute(attr.name);
        }
      } catch {
        node.removeAttribute(attr.name);
      }

      if (valor.startsWith("javascript:") || valor.startsWith("data:") || valor.startsWith("vbscript:")) {
        node.removeAttribute(attr.name);
      }
    });
  });

  return template.innerHTML;
}

export async function cargarFragmento(url, target) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`No se pudo cargar el recurso solicitado (${url}): ${response.status}`);
  }

  const html = sanitizarHTMLPermitido(await response.text());

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
        <div class="rounded-circle bg-${escaparHTML(color)} bg-opacity-10 text-${escaparHTML(color)} d-inline-flex align-items-center justify-content-center" style="width:48px;height:48px;">
          <i class="bi ${escaparHTML(icono)}"></i>
        </div>
        <div>
          <p class="text-muted mb-1">${escaparHTML(titulo)}</p>
          <h4 class="mb-0">${escaparHTML(valor)}</h4>
        </div>
      </div>
    </div>`;
}

export function renderEmptyState({ icono = "bi-inbox", titulo, descripcion, accion = "" }) {
  return `
    <div class="empty-state text-center py-5">
      <i class="bi ${escaparHTML(icono)} fs-1 text-muted"></i>
      <h4 class="mt-3">${escaparHTML(titulo)}</h4>
      <p class="text-muted mb-0">${escaparHTML(descripcion)}</p>
      ${sanitizarHTMLPermitido(accion)}
    </div>`;
}
