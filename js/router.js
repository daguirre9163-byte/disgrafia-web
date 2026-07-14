import { buildAppUrl } from "./navigation.js";

export async function loadModule(moduleName) {
  const contentArea = document.getElementById('content');
  
  try {
    const response = await fetch(buildAppUrl(`modules/${moduleName}/${moduleName}.html`));
    if (response.ok) {
      const html = await response.text();
      contentArea.innerHTML = html;
      
      // Cargar script del módulo
      const scriptPrevio = document.getElementById('module-script');
      if (scriptPrevio) {
        scriptPrevio.remove();
      }

      const script = document.createElement('script');
      script.src = buildAppUrl(`modules/${moduleName}/${moduleName}.js`);
      script.type = 'module';
      script.id = 'module-script';
      document.body.appendChild(script);
    }
  } catch (error) {
    console.error('Error cargando módulo:', error);
    contentArea.innerHTML = '<div class="alert alert-danger">Error al cargar el módulo</div>';
  }
}