//=====================================================
// SIGEDIS
// FIRESTORE
//=====================================================

import { db, auth } from "./firebase-config.js";

import {

    collection,
    addDoc,
    getDocs,
    getDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    orderBy,
    serverTimestamp

} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";


//=====================================================
// COLECCIONES
//=====================================================

const CURSOS = "cursos";


//=====================================================
// CREAR CURSO
//=====================================================

export async function crearCurso(datos){

    const usuario = auth.currentUser;

    if(!usuario){

        throw new Error("No existe una sesión activa.");

    }

    return await addDoc(

        collection(db,CURSOS),

        {

            ...datos,

            docenteId:usuario.uid,

            estado:"activo",

            totalEstudiantes:0,

            totalGuias:0,

            totalEvaluaciones:0,

            fechaCreacion:serverTimestamp()

        }

    );

}


//=====================================================
// LISTAR CURSOS DEL DOCENTE
//=====================================================

export async function listarCursos(){

    const usuario = auth.currentUser;

    if(!usuario){

        return [];

    }

    const consulta=query(

        collection(db,CURSOS),

        where("docenteId","==",usuario.uid),

        orderBy("fechaCreacion","desc")

    );

    const snapshot=await getDocs(consulta);

    return snapshot.docs.map(doc=>({

        id:doc.id,

        ...doc.data()

    }));

}


//=====================================================
// OBTENER CURSO
//=====================================================

export async function obtenerCurso(id){

    const documento=await getDoc(

        doc(db,CURSOS,id)

    );

    if(!documento.exists()){

        return null;

    }

    return{

        id:documento.id,

        ...documento.data()

    };

}


//=====================================================
// ACTUALIZAR CURSO
//=====================================================

export async function actualizarCurso(id,datos){

    return await updateDoc(

        doc(db,CURSOS,id),

        datos

    );

}


//=====================================================
// ELIMINAR CURSO
//=====================================================

export async function eliminarCurso(id){

    return await deleteDoc(

        doc(db,CURSOS,id)

    );

}