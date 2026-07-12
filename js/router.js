//======================================================
// SIGEDIS
// Router Principal
//======================================================

let moduloActual = null;

//======================================================

export async function loadModule(modulo) {

    try {

        // Evitar recargar el mismo módulo
        if (moduloActual === modulo) return;

        moduloActual = modulo;

        //=========================================
        // CARGAR HTML
        //=========================================

        const response = await fetch(`modules/${modulo}/${modulo}.html`);

        if (!response.ok) {

            throw new Error(`No existe el módulo ${modulo}`);

        }

        const html = await response.text();

        document.getElementById("content").innerHTML = html;

        //=========================================
        // ELIMINAR CSS ANTERIOR
        //=========================================

        const oldStyle = document.getElementById("module-style");

        if (oldStyle) {

            oldStyle.remove();

        }

        //=========================================
        // CARGAR CSS
        //=========================================

        const css = document.createElement("link");

        css.id = "module-style";

        css.rel = "stylesheet";

        css.href = `modules/${modulo}/${modulo}.css?v=${Date.now()}`;

        document.head.appendChild(css);

        //=========================================
        // ELIMINAR JS ANTERIOR
        //=========================================

        const oldScript = document.getElementById("module-script");

        if (oldScript) {

            oldScript.remove();

        }

        //=========================================
        // CARGAR JS
        //=========================================

        const script = document.createElement("script");

        script.id = "module-script";

        script.type = "module";

        script.src = `modules/${modulo}/${modulo}.js?v=${Date.now()}`;

        document.body.appendChild(script);

        console.log(`✅ Módulo cargado: ${modulo}`);

    }

    catch (error) {

        console.error(error);

        document.getElementById("content").innerHTML = `

            <div class="container py-5">

                <div class="alert alert-warning">

                    <h3>Módulo en construcción</h3>

                    <p>

                        El módulo <strong>${modulo}</strong> aún no está disponible.

                    </p>

                </div>

            </div>

        `;

    }

}