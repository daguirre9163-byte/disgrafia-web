export async function inicializarSeguimientoModule() {
  return import("./seguimiento/seguimiento.js");
}

export default inicializarSeguimientoModule;
