export function guardarCache(clave, datos) {
    localStorage.setItem(clave, JSON.stringify({
        timestamp: Date.now(),
        datos
    }));
}

export function leerCache(clave, ttl = 60000) {
    const cache = localStorage.getItem(clave);

    if (!cache) {
        return null;
    }

    try {
        const parseado = JSON.parse(cache);

        if (!parseado?.timestamp || Date.now() - parseado.timestamp > ttl) {
            localStorage.removeItem(clave);
            return null;
        }

        return parseado.datos;
    } catch {
        localStorage.removeItem(clave);
        return null;
    }
}

export async function obtenerConCache(clave, fetchFn, ttl = 60000) {
    const datosCache = leerCache(clave, ttl);

    if (datosCache) {
        return datosCache;
    }

    const datos = await fetchFn();
    guardarCache(clave, datos);

    return datos;
}

export async function migrarLocalStorageAFirestore({
    localStorageKey,
    crearRegistro,
    transformador = (item) => item
}) {
    const datosLocales = JSON.parse(localStorage.getItem(localStorageKey) || "[]");

    if (!Array.isArray(datosLocales) || datosLocales.length === 0) {
        return { migrados: 0 };
    }

    for (const item of datosLocales) {
        await crearRegistro(transformador(item));
    }

    return { migrados: datosLocales.length };
}
