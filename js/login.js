import {
    signInWithEmailAndPassword,
    setPersistence,
    browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import { auth, db } from "../firebase/firebase-config.js";

import {
    doc,
    getDoc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const formulario = document.getElementById("loginForm");

formulario.addEventListener("submit", iniciarSesion);

//======================================================

async function iniciarSesion(e){

    e.preventDefault();

    const correo = document.getElementById("correo").value.trim();

    const password = document.getElementById("password").value;

    if(correo==="" || password===""){

        mostrarMensaje("Complete todos los campos.","warning");

        return;

    }

    try{

        // Mantener sesión iniciada

        await setPersistence(auth,browserLocalPersistence);

        // Login

        const credencial = await signInWithEmailAndPassword(

            auth,

            correo,

            password

        );

        // Buscar usuario en Firestore

        const usuarioRef = doc(db,"usuarios",credencial.user.uid);

        const usuarioSnap = await getDoc(usuarioRef);

        if(!usuarioSnap.exists()){

            mostrarMensaje("No existe el perfil del usuario.","danger");

            return;

        }

        // Actualizar último ingreso

        await updateDoc(usuarioRef,{

            ultimoIngreso:serverTimestamp()

        });

        mostrarMensaje("Bienvenido.","success");

        setTimeout(()=>{

            window.location.href="dashboard.html";

        },800);

    }

    catch(error){

        console.error(error);

        switch(error.code){

            case "auth/user-not-found":

                mostrarMensaje("Usuario no encontrado.","danger");

            break;

            case "auth/wrong-password":

                mostrarMensaje("Contraseña incorrecta.","danger");

            break;

            case "auth/invalid-credential":

                mostrarMensaje("Correo o contraseña incorrectos.","danger");

            break;

            case "auth/too-many-requests":

                mostrarMensaje("Demasiados intentos. Espere unos minutos.","warning");

            break;

            default:

                mostrarMensaje(error.message,"danger");

        }

    }

}

//======================================================

function mostrarMensaje(texto,tipo){

    const alerta=document.createElement("div");

    alerta.className=`alert alert-${tipo} mt-3`;

    alerta.innerHTML=texto;

    formulario.appendChild(alerta);

    setTimeout(()=>{

        alerta.remove();

    },3000);

}