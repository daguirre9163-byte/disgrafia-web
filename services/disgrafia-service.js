let cacheInfo = null;

async function cargarInfo() {
  if (cacheInfo) {
    return cacheInfo;
  }

  const response = await fetch('/docs/disgrafia-info.json');
  if (!response.ok) {
    throw new Error('No fue posible cargar la información de disgrafía.');
  }

  cacheInfo = await response.json();
  return cacheInfo;
}

export async function obtenerInfoDisgrafia() {
  return cargarInfo();
}

export async function obtenerTiposDisgrafia() {
  const info = await cargarInfo();
  return info.tipos || [];
}

export async function obtenerEstrategias() {
  const info = await cargarInfo();
  return info.estrategias_intervencion || [];
}

export async function obtenerSintomas() {
  const info = await cargarInfo();
  return info.sintomas_generales || [];
}
