export function guardarDatoLocal(clave, valor) {
  localStorage.setItem(clave, JSON.stringify(valor));
  return valor;
}

export function obtenerDatoLocal(clave, valorPorDefecto = null) {
  const valor = localStorage.getItem(clave);
  if (!valor) {
    return valorPorDefecto;
  }

  try {
    return JSON.parse(valor);
  } catch (error) {
    console.warn("No se pudo parsear el dato local almacenado.", error);
    return valorPorDefecto;
  }
}

export function eliminarDatoLocal(clave) {
  localStorage.removeItem(clave);
}

export function limpiarDatosLocales(prefijo = "") {
  Object.keys(localStorage)
    .filter((clave) => !prefijo || clave.startsWith(prefijo))
    .forEach((clave) => localStorage.removeItem(clave));
}
