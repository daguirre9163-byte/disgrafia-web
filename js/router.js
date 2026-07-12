export async function loadModule(moduleName) {
  const contentArea = document.getElementById('content');
  
  try {
    const response = await fetch(`modules/${moduleName}/${moduleName}.html`);
    if (response.ok) {
      const html = await response.text();
      contentArea.innerHTML = html;
      
      // Cargar script del módulo
      const script = document.createElement('script');
      script.src = `modules/${moduleName}/${moduleName}.js`;
      script.type = 'module';
      document.body.appendChild(script);
    }
  } catch (error) {
    console.error('Error cargando módulo:', error);
    contentArea.innerHTML = '<div class="alert alert-danger">Error al cargar el módulo</div>';
  }
}