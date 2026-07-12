const STORAGE_KEY = 'admin.auditoria';
let logs = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
if (!logs.length) {
  logs = Array.from({ length: 20 }, (_, i) => ({
    id: crypto.randomUUID(),
    quien: i % 2 ? 'admin@sigedis.ec' : 'docente@sigedis.ec',
    que: i % 3 ? 'usuario.actualizar' : 'evaluacion.crear',
    cuando: new Date(Date.now() - i * 3600e3).toISOString(),
    antes: '{"estado":"activo"}',
    despues: '{"estado":"bloqueado"}',
    ip: `10.0.0.${i + 1}`,
    navegador: 'Chrome',
    estado: i % 4 ? 'exito' : 'error'
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}

const body = document.getElementById('auditoriaBody');
const filtros = {
  usuario: document.getElementById('filtroUsuario'),
  tipo: document.getElementById('filtroTipo'),
  fecha: document.getElementById('filtroFecha')
};

function escapeHtml(valor) {
  return String(valor).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function filtrados() {
  return logs
    .slice(0, 100)
    .filter((item) => {
      const byUser = !filtros.usuario.value || item.quien.toLowerCase().includes(filtros.usuario.value.toLowerCase());
      const byTipo = !filtros.tipo.value || item.que.toLowerCase().includes(filtros.tipo.value.toLowerCase());
      const byFecha = !filtros.fecha.value || item.cuando.slice(0, 10) === filtros.fecha.value;
      return byUser && byTipo && byFecha;
    });
}

function render() {
  body.innerHTML = filtrados().map((l) => `
    <tr>
      <td>${escapeHtml(l.quien)}</td><td>${escapeHtml(l.que)}</td><td>${l.cuando}</td>
      <td><code>${escapeHtml(l.antes)}</code></td><td><code>${escapeHtml(l.despues)}</code></td>
      <td>${l.ip} / ${l.navegador}</td><td>${l.estado}</td>
    </tr>
  `).join('');
}

Object.values(filtros).forEach((el) => {
  el.addEventListener('input', render);
  el.addEventListener('change', render);
});

document.getElementById('btnExportCsv').addEventListener('click', () => {
  const rows = filtrados();
  const header = 'quien,que,cuando,antes,despues,ip,navegador,estado';
  const csv = [header, ...rows.map((r) => [r.quien, r.que, r.cuando, r.antes, r.despues, r.ip, r.navegador, r.estado].map((v) => `"${String(v).replaceAll('"', '""')}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `auditoria-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
});

render();
