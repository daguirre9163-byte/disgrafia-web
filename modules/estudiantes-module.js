export async function inicializarEstudiantesModule() {
  return import("./estudiantes/estudiantes.js");
}

export default inicializarEstudiantesModule;
