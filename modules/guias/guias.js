function initGuias() {
  const contenedor = document.querySelector("#content");
  if (!contenedor) return;
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initGuias);
} else {
  initGuias();
}
