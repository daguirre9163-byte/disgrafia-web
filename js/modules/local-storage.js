const PREFIX = 'sigedis.';

export function guardarLocal(clave, valor) {
  localStorage.setItem(`${PREFIX}${clave}`, JSON.stringify(valor));
}

export function leerLocal(clave, defecto = null) {
  const raw = localStorage.getItem(`${PREFIX}${clave}`);
  if (!raw) return defecto;
  try {
    return JSON.parse(raw);
  } catch {
    return defecto;
  }
}
