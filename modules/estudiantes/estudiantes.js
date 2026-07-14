import {
  obtenerEstudiantesServicio,
  crearEstudianteServicio,
  actualizarEstudianteServicio,
  eliminarEstudianteServicio
} from "./estudiantes-service.js";

import { obtenerCursosServicio } from "../cursos/cursos-service.js";
import { sanitizarTexto } from "../../js/validaciones.js";
import { registrarNotificacion } from "../../js/notificaciones.js";

let estudiantes = [];
let cursos = [];
let estudianteEditandoId = null;
let modalEstudiante = null;
let vistaTarjeta = false;

function getModal() {
  if (!modalEstudiante) {
    modalEstudiante = new bootstrap.Modal(document.getElementById("modalEstudiante"));
  }
  return modalEstudiante;
}

// ✅ VALIDAR QUE EXISTAN CURSOS ANTES DE CREAR ESTUDIANTE
function validarCursos() {
  const btnNuevo = document.getElementById("btnNuevoEstudiante");
  const alertaSinCursos = document.getElementById("alertaSinCursos");
  const advertencia = document.getElementById("advertenciaEstudiantes");

  if (cursos.length === 0) {
    // DESHABILITAR BOTÓN
    btnNuevo.disabled = true;
    btnNuevo.innerHTML = `<i class="bi bi-lock"></i> Crear Cursos Primero`;
    
    // MOSTRAR ALERTA
    alertaSinCursos.classList.remove("d-none");
    advertencia.innerHTML = `<i class="bi bi-info-circle"></i> Debes crear cursos antes de registrar estudiantes.`;
    
    return false;
  } else {
    // HABILITAR BOTÓN
    btnNuevo.disabled = false;
    btnNuevo.innerHTML = `<i class="bi bi-plus-circle"></i> Nuevo Estudiante`;
    
    // OCULTAR ALERTA
    alertaSinCursos.classList.add("d-none");
    advertencia.innerHTML = ``;
    
    return true;
  }
}

// ✅ CARGAR DROPDOWN DE CURSOS
async function cargarCursos() {
  cursos = await obtenerCursosServicio();
  
  const selectCurso = document.getElementById("cursoEstudiante");
  const selectFiltro = document.getElementById("filtroCurso");
  
  if (selectCurso) {
    selectCurso.innerHTML = `<option value="">-- Seleccionar curso --</option>` + 
      cursos.map(c => `<option value="${c.id}">${sanitizarTexto(c.nombre)} ${sanitizarTexto(c.paralelo)}</option>`).join("");
  }
  
  if (selectFiltro) {
    selectFiltro.innerHTML = `<option value="">-- Todos los cursos --</option>` + 
      cursos.map(c => `<option value="${c.id}">${sanitizarTexto(c.nombre)} ${sanitizarTexto(c.paralelo)}</option>`).join("");
  }
  
  // VALIDAR Y MOSTRAR ALERTA SI NO HAY CURSOS
  validarCursos();
}

function mostrarMensaje(mensaje, tipo = "success") {
  const tabla = document.getElementById("tablaEstudiantes");
  if (!tabla) return;

  const alerta = document.createElement("tr");
  alerta.innerHTML = `<td colspan="6" class="text-center text-${tipo === "danger" ? "danger" : "success"} fw-bold">${sanitizarTexto(mensaje)}</td>`;
  tabla.prepend(alerta);

  setTimeout(() => alerta.remove(), 2500);
}

function filtrarLista() {
  const texto = document.getElementById("filtroEstudiante")?.value?.toLowerCase() || "";
  const nivel = document.getElementById("filtroNivel")?.value?.toLowerCase() || "";
  const disgrafia = document.getElementById("filtroDisgrafia")?.value?.toLowerCase() || "";
  const curso = document.getElementById("filtroCurso")?.value?.toLowerCase() || "";

  return estudiantes.filter((estudiante) => {
    const nombreCompleto = `${estudiante.nombre || ""} ${estudiante.apellido || ""}`.toLowerCase();
    const coincideNombre = nombreCompleto.includes(texto);
    const coincideNivel = !nivel || String(estudiante.nivel || "").toLowerCase().includes(nivel);
    const coincideDisgrafia = !disgrafia || String(estudiante.disgrafia || "").toLowerCase().includes(disgrafia);
    const coincideCurso = !curso || String(estudiante.cursoId || "").toLowerCase().includes(curso);

    return coincideNombre && coincideNivel && coincideDisgrafia && coincideCurso;
  });
}

function renderizarTabla() {
  const tabla = document.getElementById("tablaEstudiantes");
  if (!tabla) return;

  const lista = filtrarLista();
  const cards = document.getElementById("cardsEstudiantes");
  
  if (cards) {
    cards.innerHTML = lista.map((estudiante) => {
      const curso = cursos.find(c => c.id === estudiante.cursoId);
      return `
        <div class="col-md-4">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <h6 class="card-title">${sanitizarTexto(`${estudiante.nombre || ""} ${estudiante.apellido || ""}`.trim())}</h6>
              <p class="mb-1"><strong>Curso:</strong> ${sanitizarTexto(curso?.nombre || "N/A")} ${sanitizarTexto(curso?.paralelo || "")}</p>
              <p class="mb-1"><strong>Nivel:</strong> ${sanitizarTexto(estudiante.nivel || "-")}</p>
              <p class="mb-3"><strong>Disgrafía:</strong> <span class="badge bg-info">${sanitizarTexto(estudiante.disgrafia || "-")}</span></p>
              <div class="d-flex gap-2">
                <button class="btn btn-sm btn-outline-primary flex-grow-1" onclick="editarEstudiante('${estudiante.id}')">
                  <i class="bi bi-pencil"></i> Editar
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="eliminarEstudiante('${estudiante.id}')">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  if (!lista.length) {
    tabla.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No hay estudiantes registrados</td></tr>';
    return;
  }

  tabla.innerHTML = lista.map((estudiante) => {
    const curso = cursos.find(c => c.id === estudiante.cursoId);
    const nombreCurso = curso ? `${sanitizarTexto(curso.nombre)} ${sanitizarTexto(curso.paralelo)}` : "No asignado";
    
    return `
      <tr>
        <td><strong>${sanitizarTexto(`${estudiante.nombre || ""} ${estudiante.apellido || ""}`.trim())}</strong></td>
        <td><span class="badge bg-secondary">${nombreCurso}</span></td>
        <td>${sanitizarTexto(estudiante.nivel || "-")}</td>
        <td><span class="badge bg-info">${sanitizarTexto(estudiante.disgrafia || "-")}</span></td>
        <td>${sanitizarTexto(String(estudiante.totalEvaluaciones || 0))}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary" onclick="editarEstudiante('${estudiante.id}')">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="eliminarEstudiante('${estudiante.id}')">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

async function cargarEstudiantes() {
  estudiantes = await obtenerEstudiantesServicio();
  renderizarTabla();
}

function limpiarFormulario() {
  const form = document.getElementById("formEstudiante");
  if (form) {
    form.reset();
  }

  estudianteEditandoId = null;
}

async function guardarEstudiante() {
  const cursoId = document.getElementById("cursoEstudiante")?.value;
  const nombre = sanitizarTexto(document.getElementById("nombreEst")?.value);
  const apellido = sanitizarTexto(document.getElementById("apellidoEst")?.value);
  const nivel = document.getElementById("nivelEst")?.value;
  const disgrafia = document.getElementById("disgrafia")?.value;

  // VALIDACIONES
  if (!cursoId) {
    mostrarMensaje("⚠️ Selecciona un curso.", "danger");
    return;
  }

  if (!nombre || !nivel || !disgrafia) {
    mostrarMensaje("⚠️ Completa todos los campos obligatorios.", "danger");
    return;
  }

  const payload = {
    nombre,
    apellido,
    nivel,
    disgrafia,
    cursoId,
    tiposDisgrafia: [disgrafia]
  };

  if (estudianteEditandoId) {
    await actualizarEstudianteServicio(estudianteEditandoId, payload);
    mostrarMensaje("✅ Estudiante actualizado.");
    await registrarNotificacion({ mensaje: "Estudiante actualizado", tipo: "info" });
  } else {
    await crearEstudianteServicio(payload);
    mostrarMensaje("✅ Estudiante creado exitosamente.");
    await registrarNotificacion({ mensaje: "Estudiante agregado correctamente", tipo: "success" });
  }

  limpiarFormulario();
  getModal().hide();
  await cargarEstudiantes();
}

async function eliminarEstudiante(id) {
  if (!confirm("¿Eliminar este estudiante?")) {
    return;
  }

  await eliminarEstudianteServicio(id);
  mostrarMensaje("✅ Estudiante eliminado.");
  await registrarNotificacion({ mensaje: "Estudiante eliminado", tipo: "warning" });
  await cargarEstudiantes();
}

async function editarEstudiante(id) {
  const estudiante = estudiantes.find((item) => item.id === id);
  if (!estudiante) return;

  estudianteEditandoId = id;
  document.getElementById("cursoEstudiante").value = estudiante.cursoId || "";
  document.getElementById("nombreEst").value = estudiante.nombre || "";
  document.getElementById("apellidoEst").value = estudiante.apellido || "";
  document.getElementById("nivelEst").value = estudiante.nivel || "Inicial";
  document.getElementById("disgrafia").value = estudiante.disgrafia || "Motriz";
  getModal().show();
}

// FUNCIÓN PARA NAVEGAR A CURSOS
window.navigateToCursos = function(e) {
  e.preventDefault();
  // Simular click en menú de cursos
  const linkCursos = document.querySelector('[data-module="cursos"]');
  if (linkCursos) linkCursos.click();
};

async function initEstudiantes() {
  // CARGAR CURSOS PRIMERO
  await cargarCursos();
  
  // EVENT LISTENERS
  document.getElementById("filtroEstudiante")?.addEventListener("input", renderizarTabla);
  document.getElementById("filtroNivel")?.addEventListener("change", renderizarTabla);
  document.getElementById("filtroDisgrafia")?.addEventListener("change", renderizarTabla);
  document.getElementById("filtroCurso")?.addEventListener("change", renderizarTabla);
  
  document.getElementById("btnVistaEstudiantes")?.addEventListener("click", () => {
    vistaTarjeta = !vistaTarjeta;
    document.querySelector(".table-responsive")?.classList.toggle("d-none", vistaTarjeta);
    document.getElementById("cardsEstudiantes")?.classList.toggle("d-none", !vistaTarjeta);
    document.getElementById("btnVistaEstudiantes").innerHTML = vistaTarjeta
      ? '<i class="bi bi-table"></i> Vista tabla'
      : '<i class="bi bi-grid"></i> Vista tarjeta';
  });

  document.getElementById("btnImportarCSV")?.addEventListener("click", async () => {
    const archivo = document.getElementById("csvEstudiantes")?.files?.[0];
    if (!archivo || !window.Papa) {
      mostrarMensaje("⚠️ Selecciona un archivo CSV.", "danger");
      return;
    }

    window.Papa.parse(archivo, {
      header: true,
      complete: async ({ data }) => {
        let importados = 0;
        for (const item of data) {
          if (!item.nombre) continue;
          
          // VALIDAR QUE TENGA CURSO ASIGNADO
          if (!item.cursoId) {
            console.warn("Estudiante sin curso:", item);
            continue;
          }
          
          await crearEstudianteServicio({
            nombre: sanitizarTexto(item.nombre),
            apellido: sanitizarTexto(item.apellido || ""),
            nivel: sanitizarTexto(item.nivel || "Inicial"),
            disgrafia: sanitizarTexto(item.disgrafia || "Motriz"),
            cursoId: item.cursoId,
            tiposDisgrafia: [sanitizarTexto(item.disgrafia || "Motriz")]
          });
          importados++;
        }

        if (importados > 0) {
          mostrarMensaje(`✅ ${importados} estudiante(s) importado(s) correctamente.`);
          await registrarNotificacion({ mensaje: `Importación completada: ${importados} estudiantes`, tipo: "success" });
        } else {
          mostrarMensaje("⚠️ No se importó ningún estudiante. Verifica el formato del CSV.", "danger");
        }
        
        await cargarEstudiantes();
      }
    });
  });
  
  await cargarEstudiantes();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initEstudiantes);
} else {
  initEstudiantes();
}

window.guardarEstudiante = guardarEstudiante;
window.eliminarEstudiante = eliminarEstudiante;
window.editarEstudiante = editarEstudiante;