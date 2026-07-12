import { registrarUsuario } from "../firebase/auth.js";
import {
    validarEmailFormato,
    validarEmailNoDuplicado,
    validarContrasenaSegura,
    validarTelefonoEcuatoriano,
    sanitizarTexto
} from "./validaciones.js";

const formulario = document.getElementById("registroForm");

formulario?.addEventListener("submit", registrar);

async function registrar(e) {
    e.preventDefault();

    const nombre = sanitizarTexto(document.getElementById("nombre").value);
    const apellido = sanitizarTexto(document.getElementById("apellido").value);
    const correo = document.getElementById("correo").value.trim().toLowerCase();
    const institucion = sanitizarTexto(document.getElementById("institucion").value);
    const telefono = document.getElementById("telefono").value.trim();
    const password = document.getElementById("password").value;
    const confirmar = document.getElementById("confirmar").value;

    if (!nombre || !apellido || !correo || !institucion) {
        mostrarMensaje("Complete los campos obligatorios.", "warning");
        return;
    }

    const emailValido = validarEmailFormato(correo);
    if (!emailValido.valido) {
        mostrarMensaje(emailValido.mensaje, "warning");
        return;
    }

    const emailDisponible = await validarEmailNoDuplicado(correo);
    if (!emailDisponible.valido) {
        mostrarMensaje(emailDisponible.mensaje, "warning");
        return;
    }

    if (telefono) {
        const telefonoValido = validarTelefonoEcuatoriano(telefono);
        if (!telefonoValido.valido) {
            mostrarMensaje(telefonoValido.mensaje, "warning");
            return;
        }
    }

    const passwordSegura = validarContrasenaSegura(password);
    if (!passwordSegura.valido) {
        mostrarMensaje(passwordSegura.mensaje, "warning");
        return;
    }

    if (password !== confirmar) {
        mostrarMensaje("Las contraseñas no coinciden.", "warning");
        return;
    }

    const resultado = await registrarUsuario(correo, password, {
        nombre,
        apellido,
        institucion,
        telefono,
        rol: "docente"
    });

    if (!resultado.ok) {
        mostrarMensaje(resultado.mensaje, "danger");
        return;
    }

    mostrarMensaje("Cuenta creada correctamente.", "success");

    setTimeout(() => {
        window.location.href = "login.html";
    }, 800);
}

function mostrarMensaje(texto, tipo) {
    let alerta = document.getElementById("registroAlerta");

    if (!alerta) {
        alerta = document.createElement("div");
        alerta.id = "registroAlerta";
        formulario.prepend(alerta);
    }

    alerta.className = `alert alert-${tipo}`;
    alerta.textContent = texto;
}
