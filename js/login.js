import { iniciarSesion } from "../firebase/auth.js";
import { validarEmailFormato } from "./validaciones.js";

const formulario = document.getElementById("loginForm");

formulario?.addEventListener("submit", manejarInicioSesion);

async function manejarInicioSesion(e) {
    e.preventDefault();

    const correo = document.getElementById("correo").value.trim().toLowerCase();
    const password = document.getElementById("password").value;

    if (!correo || !password) {
        mostrarMensaje("Complete todos los campos.", "warning");
        return;
    }

    const validacionCorreo = validarEmailFormato(correo);
    if (!validacionCorreo.valido) {
        mostrarMensaje(validacionCorreo.mensaje, "warning");
        return;
    }

    const resultado = await iniciarSesion(correo, password);

    if (!resultado.ok) {
        mostrarMensaje(resultado.mensaje, "danger");
        return;
    }

    mostrarMensaje("Bienvenido.", "success");

    setTimeout(() => {
        window.location.href = "dashboard.html";
    }, 700);
}

function mostrarMensaje(texto, tipo) {
    const alertaExistente = formulario.querySelector(".alert");
    if (alertaExistente) {
        alertaExistente.remove();
    }

    const alerta = document.createElement("div");
    alerta.className = `alert alert-${tipo} mt-3`;
    alerta.textContent = texto;

    formulario.appendChild(alerta);

    setTimeout(() => {
        alerta.remove();
    }, 3500);
}
