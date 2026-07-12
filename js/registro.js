import {
createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
doc,
setDoc,
serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import { auth, db } from "../firebase/firebase-config.js";

const formulario=document.getElementById("registroForm");

formulario.addEventListener("submit",registrar);

//=====================================

async function registrar(e){

e.preventDefault();

const nombre=document.getElementById("nombre").value.trim();

const apellido=document.getElementById("apellido").value.trim();

const correo=document.getElementById("correo").value.trim();

const institucion=document.getElementById("institucion").value.trim();

const telefono=document.getElementById("telefono").value.trim();

const password=document.getElementById("password").value;

const confirmar=document.getElementById("confirmar").value;

if(password!==confirmar){

alert("Las contraseñas no coinciden.");

return;

}

try{

const credencial=await createUserWithEmailAndPassword(

auth,

correo,

password

);

await setDoc(

doc(db,"usuarios",credencial.user.uid),

{

uid:credencial.user.uid,

nombre,

apellido,

correo,

institucion,

telefono,

rol:"docente",

estado:"activo",

foto:"",

fechaRegistro:serverTimestamp(),

ultimoIngreso:null

}

);

alert("Cuenta creada correctamente.");

window.location.href="login.html";

}

catch(error){

console.error(error);

alert(error.message);

}

}