import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-storage.js";

import { storage } from "./firebase-config.js";

function validarArchivo(archivo) {
    if (!archivo) {
        throw new Error("Debe seleccionar un archivo.");
    }
}

export async function subirArchivo(ruta, archivo, metadata = {}) {
    validarArchivo(archivo);

    const referencia = ref(storage, ruta);
    const resultado = await uploadBytes(referencia, archivo, metadata);
    const url = await getDownloadURL(resultado.ref);

    return {
        ruta: resultado.ref.fullPath,
        url
    };
}

export async function subirFotoEstudiante(estudianteId, archivo) {
    const extension = (archivo?.name || "foto.jpg").split(".").pop();
    const ruta = `estudiantes/${estudianteId}/perfil.${extension}`;

    return subirArchivo(ruta, archivo, {
        contentType: archivo?.type || "image/jpeg"
    });
}

export async function subirDocumentoPDF(archivo, carpeta = "documentos") {
    if (archivo?.type && archivo.type !== "application/pdf") {
        throw new Error("Solo se permiten archivos PDF.");
    }

    const nombreSeguro = (archivo?.name || `archivo-${Date.now()}.pdf`).replace(/\s+/g, "-");
    const ruta = `${carpeta}/${Date.now()}-${nombreSeguro}`;

    return subirArchivo(ruta, archivo, {
        contentType: "application/pdf"
    });
}

export async function obtenerUrlPublica(ruta) {
    return getDownloadURL(ref(storage, ruta));
}

export async function eliminarArchivo(ruta) {
    await deleteObject(ref(storage, ruta));
    return { ok: true };
}
