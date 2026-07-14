import {
  listarParalelosServicio,
  crearParaleloServicio,
  actualizarParaleloServicio,
  eliminarParaleloServicio,
  obtenerParaleloServicio,
  validarEliminacionParaleloServicio
} from "./paralelos-service.js";

import { obtenerCursosServicio } from "../cursos/cursos-service.js";
import { obtenerEstudiantesServicio } from "../estudiantes/estudiantes-service.js";
import { registrarNotificacion } from "../../js/notificaciones.js";
import { sanitizarTexto } from "../../js/validaciones.js";

let cursos = [];
let paralelos = [];
let estudiantes = [];
let paraleloEditandoId = null;
let modal;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

async function init() {
  modal = new bootstrap.Modal(document.getElementById("modalParalelo"));
  bindEvents();
  await cargarDatos();
}

function bindEvents() {
  document.getElementById("btnNuevoParalelo")?.addEventListener("click", nuevoParalelo);
  document.getElementById("btnGuardarParalelo")?.addEventListener("click", guardarParalelo);
  document.getElementById("buscarParalelo")?.addEventListener("input", renderizarTabla);
  document.getElementById("filtroCursoParalelo")?.addEventListener("change", renderizarTabla);
}

async function cargarDatos() {
  try {
    const [listaCursos, listaParalelos, listaEstudiantes] = await Promise.all([
      obtenerCursosServicio(),
      listarParalelosServicio(),
      obtenerEstudiantesServicio()
    ]);

    cursos = listaCursos;
    paralelos = listaParalelos;
    estudiantes = listaEstudiantes;

    llenarCursos();
    sincronizarCursoPreseleccionado();
    actualizarEstadoCursos();
    renderizarTabla();
  } catch (error) {
    console.error("Error cargando paralelos:", error);
    await registrarNotificacion({ mensaje: "No se pudieron cargar los paralelos.", tipo: "danger" });
  }
}

function actualizarEstadoCursos() {
  const alerta = document.getElementById("alertaSinCursosParalelos");
  const btnNuevo = document.getElementById("btnNuevoParalelo");

  if (!cursos.length) {
    alerta?.classList.remove("d-none");
    if (btnNuevo) btnNuevo.disabled = true;
    return;
  }

  alerta?.classList.add("d-none");
  if (btnNuevo) btnNuevo.disabled = false;
}

function llenarCursos() {
  const opciones = cursos.map((curso) => `<option value="${curso.id}">${sanitizarTexto(curso.nombre)}</option>`).join("");
  const filtro = document.getElementById("filtroCursoParalelo");
  const select = document.getElementById("cursoParalelo");

  if (filtro) {
    filtro.innerHTML = `<option value="">Todos los cursos</option>${opciones}`;
  }

  if (select) {
    select.innerHTML = `<option value="">Seleccione un curso</option>${opciones}`;
  }
}

function sincronizarCursoPreseleccionado() {
  const cursoId = sessionStorage.getItem("paralelos.cursoId");
  if (!cursoId) return;

  const filtro = document.getElementById("filtroCursoParalelo");
  if (filtro && cursos.some((curso) => curso.id === cursoId)) {
    filtro.value = cursoId;
  }
}

function filtrarParalelos() {
  const texto = (document.getElementById("buscarParalelo")?.value || "").toLowerCase();
  const cursoId = document.getElementById("filtroCursoParalelo")?.value || "";

  return paralelos.filter((paralelo) => {
    const curso = cursos.find((item) => item.id === paralelo.cursoId);
    const coincideTexto =
      sanitizarTexto(paralelo.nombre || "").toLowerCase().includes(texto) ||
      sanitizarTexto(curso?.nombre || "").toLowerCase().includes(texto);
    const coincideCurso = !cursoId || paralelo.cursoId === cursoId;

    return coincideTexto && coincideCurso;
  });
}

function renderizarTabla() {
  const tabla = document.getElementById("tablaParalelos");
  if (!tabla) return;

  const lista = filtrarParalelos();

  if (!lista.length) {
    tabla.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No hay paralelos registrados.</td></tr>';
    return;
  }

  tabla.innerHTML = lista.map((paralelo) => {
    const curso = cursos.find((item) => item.id === paralelo.cursoId);
    const totalEstudiantes = estudiantes.filter((estudiante) => estudiante.paraleloId === paralelo.id).length;

    return `
      <tr>
        <td>${sanitizarTexto(curso?.nombre || "Curso no disponible")}</td>
        <td><span class="badge bg-primary">${sanitizarTexto(paralelo.nombre || "-")}</span></td>
        <td><span class="badge ${paralelo.estado === "inactivo" ? "bg-secondary" : "bg-success"}">${sanitizarTexto(paralelo.estado || "activo")}</span></td>
        <td>${totalEstudiantes}</td>
        <td class="text-end">
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-info ver-estudiantes" data-id="${paralelo.id}" type="button">Ver estudiantes</button>
            <button class="btn btn-outline-primary editar-paralelo" data-id="${paralelo.id}" type="button"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-outline-danger eliminar-paralelo" data-id="${paralelo.id}" type="button"><i class="bi bi-trash"></i></button>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  document.querySelectorAll(".editar-paralelo").forEach((boton) => {
    boton.addEventListener("click", () => editarParalelo(boton.dataset.id));
  });

  document.querySelectorAll(".eliminar-paralelo").forEach((boton) => {
    boton.addEventListener("click", () => borrarParalelo(boton.dataset.id));
  });

  document.querySelectorAll(".ver-estudiantes").forEach((boton) => {
    boton.addEventListener("click", () => verEstudiantes(boton.dataset.id));
  });
}

function nuevoParalelo() {
  paraleloEditandoId = null;
  document.getElementById("formParalelo")?.reset();
  document.getElementById("estadoParalelo").value = "activo";

  const cursoId = document.getElementById("filtroCursoParalelo")?.value;
  if (cursoId) {
    document.getElementById("cursoParalelo").value = cursoId;
  }

  modal.show();
}

async function guardarParalelo() {
  const datos = {
    cursoId: document.getElementById("cursoParalelo").value,
    nombre: sanitizarTexto(document.getElementById("nombreParalelo").value.trim().toUpperCase()),
    estado: document.getElementById("estadoParalelo").value
  };

  if (!datos.cursoId || !datos.nombre) {
    await registrarNotificacion({ mensaje: "Completa curso y nombre del paralelo.", tipo: "danger" });
    return;
  }

  try {
    if (paraleloEditandoId) {
      await actualizarParaleloServicio(paraleloEditandoId, datos);
      await registrarNotificacion({ mensaje: "Paralelo actualizado correctamente.", tipo: "success" });
    } else {
      await crearParaleloServicio(datos);
      await registrarNotificacion({ mensaje: "Paralelo creado correctamente.", tipo: "success" });
    }

    modal.hide();
    await cargarDatos();
  } catch (error) {
    await registrarNotificacion({ mensaje: error.message || "No se pudo guardar el paralelo.", tipo: "danger" });
  }
}

async function editarParalelo(id) {
  const paralelo = await obtenerParaleloServicio(id);
  if (!paralelo) return;

  paraleloEditandoId = id;
  document.getElementById("cursoParalelo").value = paralelo.cursoId || "";
  document.getElementById("nombreParalelo").value = paralelo.nombre || "";
  document.getElementById("estadoParalelo").value = paralelo.estado || "activo";
  modal.show();
}

async function borrarParalelo(id) {
  const validacion = await validarEliminacionParaleloServicio(id);
  if (!validacion.valido) {
    await registrarNotificacion({ mensaje: validacion.mensaje, tipo: "danger" });
    return;
  }

  if (!confirm("¿Eliminar este paralelo?")) return;

  try {
    await eliminarParaleloServicio(id);
    await registrarNotificacion({ mensaje: "Paralelo eliminado correctamente.", tipo: "warning" });
    await cargarDatos();
  } catch (error) {
    await registrarNotificacion({ mensaje: error.message || "No se pudo eliminar el paralelo.", tipo: "danger" });
  }
}

function verEstudiantes(paraleloId) {
  const paralelo = paralelos.find((item) => item.id === paraleloId);
  if (!paralelo) return;

  sessionStorage.setItem("estudiantes.cursoId", paralelo.cursoId);
  sessionStorage.setItem("estudiantes.paraleloId", paralelo.id);
  document.querySelector('[data-module="estudiantes"]')?.click();
}
