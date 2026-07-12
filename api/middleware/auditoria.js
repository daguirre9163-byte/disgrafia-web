import { randomUUID } from 'node:crypto';

const logs = [];

export function registrarAuditoria({ user, action, resource, before = null, after = null, ip = '0.0.0.0', userAgent = 'unknown', estado = 'exito' }) {
  logs.unshift({
    id: randomUUID(),
    user: user?.email || 'sistema',
    action,
    resource,
    timestamp: new Date().toISOString(),
    before,
    after,
    ip,
    userAgent,
    estado
  });
  return logs.slice(0, 1000);
}

export function obtenerLogs() {
  return logs.slice(0, 100);
}
