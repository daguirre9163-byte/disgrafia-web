export function getAppBasePath() {
  const base = document.body?.dataset?.appBase || "";
  if (!base) return "";
  return base.endsWith("/") ? base : `${base}/`;
}

export function buildAppUrl(path = "") {
  if (typeof path !== "string") {
    throw new TypeError(`buildAppUrl expects path to be a string. Received: ${typeof path}`);
  }

  const normalizedPath = path.replace(/^\/+/, "");
  return `${getAppBasePath()}${normalizedPath}`;
}

export function getStartModule(defaultModule = "dashboard") {
  const params = new URLSearchParams(window.location.search);
  return params.get("module") || document.body?.dataset?.startModule || defaultModule;
}

export function setActiveModule(moduleName) {
  document.querySelectorAll(".menu-link").forEach((item) => {
    item.classList.toggle("active", item.dataset.module === moduleName);
  });
}
