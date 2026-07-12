import { db } from "../firebase/firebase-config.js";
import {
    collection,
    query,
    where,
    getDocs,
    limit
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

export function sanitizarTexto(valor = "") {
    return String(valor)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;")
        .trim();
}

export function validarEmailFormato(email) {
    const correo = String(email || "").trim();
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!regex.test(correo)) {
        return { valido: false, mensaje: "Ingrese un correo electrónico válido." };
    }

    return { valido: true, mensaje: "" };
}

export async function validarEmailNoDuplicado(email, uidActual = null) {
    const validacion = validarEmailFormato(email);

    if (!validacion.valido) {
        return validacion;
    }

    const consulta = query(
        collection(db, "usuarios"),
        where("correo", "==", String(email).trim().toLowerCase()),
        limit(1)
    );

    const resultado = await getDocs(consulta);

    if (resultado.empty) {
        return { valido: true, mensaje: "" };
    }

    const usuario = resultado.docs[0];

    if (uidActual && usuario.id === uidActual) {
        return { valido: true, mensaje: "" };
    }

    return { valido: false, mensaje: "El correo ya está registrado." };
}

export function validarContrasenaSegura(password) {
    const valor = String(password || "");

    if (valor.length < 8) {
        return { valido: false, mensaje: "La contraseña debe tener al menos 8 caracteres." };
    }

    if (!/[A-Z]/.test(valor)) {
        return { valido: false, mensaje: "La contraseña debe incluir una letra mayúscula." };
    }

    if (!/\d/.test(valor)) {
        return { valido: false, mensaje: "La contraseña debe incluir al menos un número." };
    }

    return { valido: true, mensaje: "" };
}

export function validarCedulaEcuatoriana(cedula) {
    const valor = String(cedula || "").trim();

    if (!/^\d{10}$/.test(valor)) {
        return { valido: false, mensaje: "La cédula debe tener exactamente 10 dígitos." };
    }

    const provincia = parseInt(valor.slice(0, 2), 10);
    if (provincia < 1 || provincia > 24) {
        return { valido: false, mensaje: "La cédula no corresponde a una provincia válida." };
    }

    const tercerDigito = parseInt(valor[2], 10);
    if (tercerDigito > 5) {
        return { valido: false, mensaje: "El tercer dígito de la cédula no es válido." };
    }

    const digitos = valor.split("").map(Number);
    const verificador = digitos.pop();

    const total = digitos.reduce((acumulado, digito, indice) => {
        let actual = digito;
        if (indice % 2 === 0) {
            actual *= 2;
            if (actual > 9) {
                actual -= 9;
            }
        }

        return acumulado + actual;
    }, 0);

    const esperado = total % 10 === 0 ? 0 : 10 - (total % 10);

    if (esperado !== verificador) {
        return { valido: false, mensaje: "La cédula ingresada no es válida." };
    }

    return { valido: true, mensaje: "" };
}

export function validarTelefonoEcuatoriano(telefono) {
    const valor = String(telefono || "").trim();

    if (!/^0\d{9}$/.test(valor)) {
        return { valido: false, mensaje: "El teléfono ecuatoriano debe tener 10 dígitos y empezar con 0." };
    }

    return { valido: true, mensaje: "" };
}
