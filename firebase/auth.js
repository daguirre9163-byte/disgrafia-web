import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import { auth, db } from "./firebase-config.js";

function mapearErrorAuth(error) {
    const mensajes = {
        "auth/invalid-email": "El correo electrónico no es válido.",
        "auth/user-disabled": "Esta cuenta se encuentra deshabilitada.",
        "auth/user-not-found": "No existe una cuenta con este correo.",
        "auth/wrong-password": "La contraseña es incorrecta.",
        "auth/invalid-credential": "Credenciales inválidas.",
        "auth/email-already-in-use": "El correo ya está registrado.",
        "auth/weak-password": "La contraseña es demasiado débil.",
        "auth/too-many-requests": "Demasiados intentos. Intente nuevamente más tarde."
    };

    return {
        codigo: error?.code || "auth/unknown",
        mensaje: mensajes[error?.code] || error?.message || "Error de autenticación."
    };
}

export async function iniciarSesion(email, password) {
    try {
        const credencial = await signInWithEmailAndPassword(auth, email, password);
        const referenciaUsuario = doc(db, "usuarios", credencial.user.uid);
        const documentoUsuario = await getDoc(referenciaUsuario);

        if (documentoUsuario.exists()) {
            await updateDoc(referenciaUsuario, {
                ultimoIngreso: serverTimestamp()
            });
        }

        return {
            ok: true,
            usuario: credencial.user
        };
    } catch (error) {
        return {
            ok: false,
            ...mapearErrorAuth(error)
        };
    }
}

export async function registrarUsuario(email, password, datosDocente = {}) {
    try {
        const credencial = await createUserWithEmailAndPassword(auth, email, password);
        const usuarioBase = {
            uid: credencial.user.uid,
            nombre: datosDocente.nombre || "",
            apellido: datosDocente.apellido || "",
            correo: email,
            institucion: datosDocente.institucion || "",
            telefono: datosDocente.telefono || "",
            rol: datosDocente.rol || "docente",
            estado: datosDocente.estado || "activo",
            foto: datosDocente.foto || "",
            fechaRegistro: serverTimestamp(),
            ultimoIngreso: serverTimestamp()
        };

        await setDoc(doc(db, "usuarios", credencial.user.uid), usuarioBase, { merge: true });

        return {
            ok: true,
            usuario: credencial.user
        };
    } catch (error) {
        return {
            ok: false,
            ...mapearErrorAuth(error)
        };
    }
}

export async function cerrarSesion() {
    try {
        await signOut(auth);
        return { ok: true };
    } catch (error) {
        return {
            ok: false,
            ...mapearErrorAuth(error)
        };
    }
}

export async function recuperarPassword(email) {
    try {
        await sendPasswordResetEmail(auth, email);
        return {
            ok: true,
            mensaje: "Se envió un correo para recuperar la contraseña."
        };
    } catch (error) {
        return {
            ok: false,
            ...mapearErrorAuth(error)
        };
    }
}
