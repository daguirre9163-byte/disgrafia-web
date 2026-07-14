import "./app.js";
import { buildAppUrl } from "./navigation.js";

async function protegerVista() {
  const guardsUrl = new URL(buildAppUrl("firebase/guards.js"), window.location.href).href;
  const { protegerPagina } = await import(guardsUrl);
  protegerPagina();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", protegerVista, { once: true });
} else {
  protegerVista();
}
