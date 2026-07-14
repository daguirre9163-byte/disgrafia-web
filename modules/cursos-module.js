export async function inicializarCursosModule() {
  return import("./cursos/cursos.js");
}

export default inicializarCursosModule;
