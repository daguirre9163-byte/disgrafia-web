import { obtenerRecursos } from "../../firebase/firestore.js";

const recursosFallback = [
  { id: "r1", titulo: "Trazos guiados", tipo: "pdf", disgrafia: "Motriz", descripcion: "Plantillas para mejorar motricidad fina", rating: 5, url: "#" },
  { id: "r2", titulo: "Video agarre de lápiz", tipo: "video", disgrafia: "Visuoespacial", descripcion: "Guía visual para postura y agarre", rating: 4, url: "#" },
  { id: "r3", titulo: "Juego de sílabas", tipo: "herramienta", disgrafia: "Lingüística", descripcion: "Actividad interactiva de escritura", rating: 4, url: "#" }
];

export async function obtenerRecursosServicio() {
  try {
    const recursos = await obtenerRecursos();
    return recursos.length ? recursos : recursosFallback;
  } catch {
    return recursosFallback;
  }
}
