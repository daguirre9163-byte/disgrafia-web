function getDatasetValue(key) {
  return document.body?.dataset?.[key] || document.documentElement?.dataset?.[key] || "";
}

export function getAppBasePath() {
  const base = getDatasetValue("appBase");
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
  return params.get("module") || getDatasetValue("startModule") || defaultModule;
}

export function setActiveModule(moduleName) {
  document.querySelectorAll(".menu-link").forEach((item) => {
    item.classList.toggle("active", item.dataset.module === moduleName);
  });
}
