import {
  obtenerEstudiantesServicio,
  crearEstudianteServicio,
  actualizarEstudianteServicio,
  eliminarEstudianteServicio,
  validarEstudianteCursoParaleloServicio
} from "./estudiantes-service.js";

import { obtenerCursosServicio } from "../cursos/cursos-service.js";
import { listarParalelosServicio } from "../paralelos/paralelos-service.js";
import {
  sanitizarTexto,
  validarCedulaEcuatoriana,
  validarTelefonoEcuatoriano
} from "../../js/validaciones.js";
import { registrarNotificacion } from "../../js/notificaciones.js";

let estudiantes = [];
let cursos = [];
let paralelos = [];
let estudianteEditandoId = null;
let modalEstudiante = null;
let vistaTarjeta = false;

function getModal() {
  if (!modalEstudiante) {
    modalEstudiante = new bootstrap.Modal(document.getElementById("modalEstudiante"));
  }
  return modalEstudiante;
}

function obtenerNombreEstudiante(estudiante = {}) {
  return `${estudiante.nombres || estudiante.nombre || ""} ${estudiante.apellidos || estudiante.apellido || ""}`.trim();
}

function obtenerCursoPorId(cursoId) {
  return cursos.find((curso) => curso.id === cursoId) || null;
}

function obtenerParaleloPorId(paraleloId) {
  return paralelos.find((paralelo) => paralelo.id === paraleloId) || null;
}

function getParalelosDeCurso(cursoId) {
  return paralelos
    .filter((paralelo) => paralelo.cursoId === cursoId)
    .sort((a, b) => String(a.nombre || "").localeCompare(String(b.nombre || ""), "es"));
}

function validarCursos() {
  const btnNuevo = document.getElementById("btnNuevoEstudiante");
  const alertaSinCursos = document.getElementById("alertaSinCursos");
  const advertencia = document.getElementById("advertenciaEstudiantes");

  if (!cursos.length) {
    if (btnNuevo) {
      btnNuevo.disabled = true;
      btnNuevo.innerHTML = `<i class="bi bi-lock"></i> Crear Cursos Primero`;
    }

    alertaSinCursos?.classList.remove("d-none");
    advertencia.textContent = "Debe crear al menos un curso y sus paralelos antes de registrar estudiantes.";
    return false;
  }

  alertaSinCursos?.classList.add("d-none");
  advertencia.textContent = "Seleccione un curso y luego el paralelo correspondiente.";

  if (btnNuevo) {
    btnNuevo.disabled = false;
    btnNuevo.innerHTML = `<i class="bi bi-plus-circle"></i> Nuevo Estudiante`;
  }

  return true;
}

function actualizarAlertaParalelos(cursoId = "") {
  const alerta = document.getElementById("alertaSinParalelos");
  const cursoTieneParalelos = cursoId ? getParalelosDeCurso(cursoId).length > 0 : true;

  if (!cursoId || cursoTieneParalelos) {
    alerta?.classList.add("d-none");
    return true;
  }

  sessionStorage.setItem("paralelos.cursoId", cursoId);
  alerta?.classList.remove("d-none");
  return false;
}

async function cargarCursos() {
  cursos = await obtenerCursosServicio();

  const opciones = cursos.map((curso) => `<option value="${curso.id}">${sanitizarTexto(curso.nombre)}</option>`).join("");
  const selectCurso = document.getElementById("cursoEstudiante");
  const selectFiltro = document.getElementById("filtroCurso");

  if (selectCurso) {
    selectCurso.innerHTML = `<option value="">-- Seleccionar curso --</option>${opciones}`;
  }

  if (selectFiltro) {
    selectFiltro.innerHTML = `<option value="">-- Todos los cursos --</option>${opciones}`;
  }

  validarCursos();
}

async function cargarParalelos() {
  paralelos = await listarParalelosServicio();
  actualizarFiltroParalelos();
}

function actualizarFiltroParalelos(cursoId = "") {
  const selectFiltro = document.getElementById("filtroParalelo");
  if (!selectFiltro) return;

  const opciones = getParalelosDeCurso(cursoId || document.getElementById("filtroCurso")?.value || "")
    .map((paralelo) => `<option value="${paralelo.id}">${sanitizarTexto(paralelo.nombre)}</option>`)
    .join("");

  selectFiltro.innerHTML = `<option value="">-- Todos los paralelos --</option>${opciones}`;
}

function cargarParalelosFormulario(cursoId, paraleloSeleccionado = "") {
  const selectParalelo = document.getElementById("paraleloEstudiante");
  if (!selectParalelo) return;

  const lista = getParalelosDeCurso(cursoId);
  selectParalelo.disabled = !cursoId || !lista.length;
  selectParalelo.innerHTML = `<option value="">-- Seleccione un paralelo --</option>${lista
    .map((paralelo) => `<option value="${paralelo.id}">${sanitizarTexto(paralelo.nombre)}</option>`)
    .join("")}`;

  if (paraleloSeleccionado && lista.some((paralelo) => paralelo.id === paraleloSeleccionado)) {
    selectParalelo.value = paraleloSeleccionado;
  }

  actualizarAlertaParalelos(cursoId);
}

function mostrarMensaje(mensaje, tipo = "success") {
  const tabla = document.getElementById("tablaEstudiantes");
  if (!tabla) return;

  const alerta = document.createElement("tr");
  alerta.innerHTML = `<td colspan="7" class="text-center text-${tipo === "danger" ? "danger" : "success"} fw-bold">${sanitizarTexto(mensaje)}</td>`;
  tabla.prepend(alerta);

  setTimeout(() => alerta.remove(), 2500);
}

function filtrarLista() {
  const texto = document.getElementById("filtroEstudiante")?.value?.toLowerCase() || "";
  const disgrafia = document.getElementById("filtroDisgrafia")?.value || "";
  const cursoId = document.getElementById("filtroCurso")?.value || "";
  const paraleloId = document.getElementById("filtroParalelo")?.value || "";

  return estudiantes.filter((estudiante) => {
    const nombre = obtenerNombreEstudiante(estudiante).toLowerCase();
    const cedula = String(estudiante.cedula || "").toLowerCase();
    const coincideTexto = !texto || nombre.includes(texto) || cedula.includes(texto);
    const coincideDiagnostico = !disgrafia || String(estudiante.disgrafia || "").toLowerCase() === disgrafia.toLowerCase();
    const coincideCurso = !cursoId || estudiante.cursoId === cursoId;
    const coincideParalelo = !paraleloId || estudiante.paraleloId === paraleloId;

    return coincideTexto && coincideDiagnostico && coincideCurso && coincideParalelo;
  });
}

function renderizarTabla() {
  const tabla = document.getElementById("tablaEstudiantes");
  if (!tabla) return;

  const lista = filtrarLista();
  const cards = document.getElementById("cardsEstudiantes");

  if (cards) {
    cards.innerHTML = lista.map((estudiante) => {
      const curso = obtenerCursoPorId(estudiante.cursoId);
      const paralelo = obtenerParaleloPorId(estudiante.paraleloId);
      return `
        <div class="col-md-4">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <h6 class="card-title">${sanitizarTexto(obtenerNombreEstudiante(estudiante) || "Sin nombre")}</h6>
              <p class="mb-1"><strong>Curso:</strong> ${sanitizarTexto(curso?.nombre || "N/A")}</p>
              <p class="mb-1"><strong>Paralelo:</strong> ${sanitizarTexto(paralelo?.nombre || "N/A")}</p>
              <p class="mb-1"><strong>Sexo:</strong> ${sanitizarTexto(estudiante.sexo || "-")}</p>
              <p class="mb-3"><strong>Diagnóstico:</strong> <span class="badge bg-info">${sanitizarTexto(estudiante.disgrafia || estudiante.diagnostico || "-")}</span></p>
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
    tabla.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No hay estudiantes registrados</td></tr>';
    return;
  }

  tabla.innerHTML = lista.map((estudiante) => {
    const curso = obtenerCursoPorId(estudiante.cursoId);
    const paralelo = obtenerParaleloPorId(estudiante.paraleloId);

    return `
      <tr>
        <td>
          <strong>${sanitizarTexto(obtenerNombreEstudiante(estudiante) || "Sin nombre")}</strong>
          <div class="small text-muted">${sanitizarTexto(estudiante.cedula || "Sin cédula")}</div>
        </td>
        <td>${sanitizarTexto(curso?.nombre || "No asignado")}</td>
        <td><span class="badge bg-secondary">${sanitizarTexto(paralelo?.nombre || "Sin paralelo")}</span></td>
        <td>${sanitizarTexto(estudiante.sexo || "-")}</td>
        <td>${sanitizarTexto(estudiante.disgrafia || estudiante.diagnostico || "-")}</td>
        <td><span class="badge ${estudiante.estado === "inactivo" ? "bg-secondary" : "bg-success"}">${sanitizarTexto(estudiante.estado || "activo")}</span></td>
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
  document.getElementById("formEstudiante")?.reset();
  document.getElementById("estadoEst").value = "activo";
  estudianteEditandoId = null;

  const cursoId = document.getElementById("cursoEstudiante")?.value || "";
  cargarParalelosFormulario(cursoId);
}

async function guardarEstudiante() {
  const cursoId = document.getElementById("cursoEstudiante")?.value || "";
  const paraleloId = document.getElementById("paraleloEstudiante")?.value || "";
  const curso = obtenerCursoPorId(cursoId);
  const nombres = sanitizarTexto(document.getElementById("nombresEst")?.value);
  const apellidos = sanitizarTexto(document.getElementById("apellidosEst")?.value);
  const cedula = sanitizarTexto(document.getElementById("cedulaEst")?.value);
  const telefono = sanitizarTexto(document.getElementById("telefonoEst")?.value);
  const disgrafia = document.getElementById("disgrafia")?.value || "Motriz";
  const diagnostico = sanitizarTexto(document.getElementById("diagnosticoEst")?.value);

  if (!cursoId) {
    mostrarMensaje("⚠️ Selecciona un curso.", "danger");
    return;
  }

  if (!actualizarAlertaParalelos(cursoId)) {
    mostrarMensaje("⚠️ El curso seleccionado no tiene paralelos registrados.", "danger");
    return;
  }

  if (!paraleloId) {
    mostrarMensaje("⚠️ Selecciona un paralelo.", "danger");
    return;
  }

  if (!nombres) {
    mostrarMensaje("⚠️ Ingresa los nombres del estudiante.", "danger");
    return;
  }

  if (cedula) {
    const validacionCedula = validarCedulaEcuatoriana(cedula);
    if (!validacionCedula.valido) {
      mostrarMensaje(`⚠️ ${validacionCedula.mensaje}`, "danger");
      return;
    }
  }

  if (telefono) {
    const validacionTelefono = validarTelefonoEcuatoriano(telefono);
    if (!validacionTelefono.valido) {
      mostrarMensaje(`⚠️ ${validacionTelefono.mensaje}`, "danger");
      return;
    }
  }

  const integridad = await validarEstudianteCursoParaleloServicio(cursoId, paraleloId);
  if (!integridad.valido) {
    mostrarMensaje(`⚠️ ${integridad.mensaje}`, "danger");
    return;
  }

  const payload = {
    cursoId,
    paraleloId,
    cedula: cedula || undefined,
    nombres,
    apellidos,
    nombre: nombres,
    apellido: apellidos,
    fechaNacimiento: document.getElementById("fechaNacimientoEst")?.value || undefined,
    sexo: document.getElementById("sexoEst")?.value || undefined,
    representante: sanitizarTexto(document.getElementById("representanteEst")?.value),
    telefono: telefono || undefined,
    direccion: sanitizarTexto(document.getElementById("direccionEst")?.value),
    diagnostico,
    disgrafia,
    tiposDisgrafia: [disgrafia],
    estado: document.getElementById("estadoEst")?.value || "activo",
    nivel: curso?.nivel || ""
  };

  try {
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
  } catch (error) {
    mostrarMensaje(`⚠️ ${error.message || "No se pudo guardar el estudiante."}`, "danger");
  }
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
  cargarParalelosFormulario(estudiante.cursoId || "", estudiante.paraleloId || "");
  document.getElementById("cedulaEst").value = estudiante.cedula || "";
  document.getElementById("nombresEst").value = estudiante.nombres || estudiante.nombre || "";
  document.getElementById("apellidosEst").value = estudiante.apellidos || estudiante.apellido || "";
  document.getElementById("fechaNacimientoEst").value = estudiante.fechaNacimiento || "";
  document.getElementById("sexoEst").value = estudiante.sexo || "";
  document.getElementById("representanteEst").value = estudiante.representante || "";
  document.getElementById("telefonoEst").value = estudiante.telefono || "";
  document.getElementById("direccionEst").value = estudiante.direccion || "";
  document.getElementById("disgrafia").value = estudiante.disgrafia || "Motriz";
  document.getElementById("diagnosticoEst").value = estudiante.diagnostico || "";
  document.getElementById("estadoEst").value = estudiante.estado || "activo";
  getModal().show();
}

function aplicarFiltrosPersistidos() {
  const cursoId = sessionStorage.getItem("estudiantes.cursoId") || "";
  const paraleloId = sessionStorage.getItem("estudiantes.paraleloId") || "";

  if (cursoId) {
    const filtroCurso = document.getElementById("filtroCurso");
    if (filtroCurso && cursos.some((curso) => curso.id === cursoId)) {
      filtroCurso.value = cursoId;
      actualizarFiltroParalelos(cursoId);
      document.getElementById("filtroParalelo").value = paraleloId;
    }
  }
}

async function importarCSV() {
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
        if (!item.nombres && !item.nombre) continue;
        if (!item.cursoId || !item.paraleloId) continue;

        const integridad = await validarEstudianteCursoParaleloServicio(item.cursoId, item.paraleloId);
        if (!integridad.valido) continue;

        await crearEstudianteServicio({
          cursoId: item.cursoId,
          paraleloId: item.paraleloId,
          nombres: sanitizarTexto(item.nombres || item.nombre || ""),
          apellidos: sanitizarTexto(item.apellidos || item.apellido || ""),
          nombre: sanitizarTexto(item.nombres || item.nombre || ""),
          apellido: sanitizarTexto(item.apellidos || item.apellido || ""),
          cedula: sanitizarTexto(item.cedula || ""),
          sexo: sanitizarTexto(item.sexo || ""),
          estado: sanitizarTexto(item.estado || "activo"),
          fechaNacimiento: item.fechaNacimiento || "",
          representante: sanitizarTexto(item.representante || ""),
          telefono: sanitizarTexto(item.telefono || ""),
          direccion: sanitizarTexto(item.direccion || ""),
          diagnostico: sanitizarTexto(item.diagnostico || ""),
          disgrafia: sanitizarTexto(item.disgrafia || "Motriz"),
          tiposDisgrafia: [sanitizarTexto(item.disgrafia || "Motriz")],
          nivel: obtenerCursoPorId(item.cursoId)?.nivel || ""
        });
        importados++;
      }

      if (importados > 0) {
        mostrarMensaje(`✅ ${importados} estudiante(s) importado(s) correctamente.`);
        await registrarNotificacion({ mensaje: `Importación completada: ${importados} estudiantes`, tipo: "success" });
      } else {
        mostrarMensaje("⚠️ No se importó ningún estudiante. Verifica cursoId y paraleloId en el CSV.", "danger");
      }

      await cargarEstudiantes();
    }
  });
}

async function initEstudiantes() {
  await Promise.all([cargarCursos(), cargarParalelos()]);
  aplicarFiltrosPersistidos();

  const btnNuevo = document.getElementById("btnNuevoEstudiante");
  if (btnNuevo && validarCursos()) {
    btnNuevo.addEventListener("click", () => {
      limpiarFormulario();
      getModal().show();
    });
  }

  document.getElementById("cursoEstudiante")?.addEventListener("change", (event) => {
    cargarParalelosFormulario(event.target.value);
  });

  document.getElementById("filtroCurso")?.addEventListener("change", (event) => {
    actualizarFiltroParalelos(event.target.value);
    renderizarTabla();
  });

  document.getElementById("filtroParalelo")?.addEventListener("change", renderizarTabla);
  document.getElementById("filtroEstudiante")?.addEventListener("input", renderizarTabla);
  document.getElementById("filtroDisgrafia")?.addEventListener("change", renderizarTabla);

  document.getElementById("btnVistaEstudiantes")?.addEventListener("click", () => {
    vistaTarjeta = !vistaTarjeta;
    document.querySelector(".table-responsive")?.classList.toggle("d-none", vistaTarjeta);
    document.getElementById("cardsEstudiantes")?.classList.toggle("d-none", !vistaTarjeta);
    document.getElementById("btnVistaEstudiantes").innerHTML = vistaTarjeta
      ? '<i class="bi bi-table"></i> Vista tabla'
      : '<i class="bi bi-grid"></i> Vista tarjeta';
  });

  document.getElementById("btnImportarCSV")?.addEventListener("click", importarCSV);

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
