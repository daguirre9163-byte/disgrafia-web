import { obtenerRecursosServicio } from "./recursos-service.js";
import { registrarNotificacion } from "../../js/notificaciones.js";

let recursos = [];

function estrellas(valor = 0) {
  return "★".repeat(Math.max(0, Number(valor || 0)));
}

function filtrados() {
  const texto = (document.getElementById("buscarRecurso")?.value || "").toLowerCase();
  const tipo = document.getElementById("filtroTipoRecurso")?.value || "";
  const disgrafia = document.getElementById("filtroDisgrafiaRecurso")?.value || "";

  return recursos.filter((item) => {
    const coincideTexto = (item.titulo || "").toLowerCase().includes(texto);
    const coincideTipo = !tipo || item.tipo === tipo;
    const coincideDisgrafia = !disgrafia || item.disgrafia === disgrafia;
    return coincideTexto && coincideTipo && coincideDisgrafia;
  });
}

function render() {
  const contenedor = document.getElementById("galeriaRecursos");
  if (!contenedor) return;

  const lista = filtrados();
  contenedor.innerHTML = lista.map((item) => `
    <div class="col-md-4">
      <div class="card border-0 shadow-sm h-100">
        <div class="card-body">
          <span class="badge bg-secondary text-uppercase mb-2">${item.tipo}</span>
          <h5>${item.titulo}</h5>
          <p class="text-muted small">${item.descripcion || ""}</p>
          <p class="small"><strong>Disgrafía:</strong> ${item.disgrafia || "General"}</p>
          <p class="small mb-3"><strong>Rating:</strong> ${estrellas(item.rating)}</p>
          <a href="${item.url || "#"}" class="btn btn-outline-primary btn-sm btnDescargarRecurso" data-id="${item.id}">Descargar</a>
        </div>
      </div>
    </div>
  `).join("");

  contenedor.querySelectorAll(".btnDescargarRecurso").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await registrarNotificacion({ mensaje: "Recurso descargado", tipo: "info" });
    });
  });
}

async function initRecursos() {
  recursos = await obtenerRecursosServicio();
  render();
  document.getElementById("buscarRecurso")?.addEventListener("input", render);
  document.getElementById("filtroTipoRecurso")?.addEventListener("change", render);
  document.getElementById("filtroDisgrafiaRecurso")?.addEventListener("change", render);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initRecursos);
} else {
  initRecursos();
}
