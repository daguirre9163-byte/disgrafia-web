export function exportarHtmlComoPdf(titulo, htmlContenido) {
  const ventana = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700');
  if (!ventana) return;

  ventana.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${titulo}</title>
  <style>body{font-family:Arial,sans-serif;padding:24px;color:#0f172a}h1{margin-top:0}.item{padding:10px 0;border-bottom:1px solid #e2e8f0}</style>
  </head><body><h1>${titulo}</h1>${htmlContenido}</body></html>`);
  ventana.document.close();
  ventana.focus();
  ventana.print();
}
