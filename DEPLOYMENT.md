# 🚀 Guía de Despliegue en Firebase Hosting

## Prerequisitos

Antes de desplegar, asegúrate de tener instalado:

- **Node.js** (versión 14 o superior)
- **Firebase CLI** (herramienta de línea de comandos)

## Instalación de Firebase CLI

Si aún no tienes Firebase CLI instalado, ejecuta:

```bash
npm install -g firebase-tools
```

## Pasos para Desplegar

### 1. **Autenticarse con Firebase**

```bash
firebase login
```

Esto abrirá tu navegador para que inicies sesión con tu cuenta de Google.

### 2. **Inicializar el Proyecto (si es la primera vez)**

Si ya tienes `.firebaserc` configurado, puedes saltarte este paso. Si no:

```bash
firebase init hosting
```

Responde las preguntas:
- ¿Cuál es tu proyecto de Firebase? → Selecciona el proyecto
- ¿Cuál es tu directorio público? → `.` (punto, ya que los archivos están en la raíz)
- ¿Configurar como SPA? → `Y` (Sí)
- ¿Sobrescribir index.html? → `N` (No)

### 3. **Configurar Credenciales de Firebase**

Antes de desplegar, actualiza `config/firebase-config.js` con tus credenciales reales de Firebase:

```javascript
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID"
};
```

Obtén estas credenciales desde:
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a Configuración del proyecto (⚙️)
4. Copia las credenciales de tu aplicación web

### 4. **Desplegar a Firebase**

```bash
firebase deploy
```

O para desplegar solo hosting:

```bash
firebase deploy --only hosting
```

### 5. **Verificar el Despliegue**

Una vez completado, Firebase mostrará la URL de tu sitio:

```
✔ Deploy complete!

Project Console: https://console.firebase.google.com/project/tu-proyecto/overview
Hosting URL: https://tu-proyecto.firebaseapp.com
```

## Comandos Útiles

### Servir Localmente

Para probar antes de desplegar:

```bash
firebase serve
```

O usando npm:

```bash
npm start
```

La aplicación estará disponible en `http://localhost:5000`

### Ver Logs

```bash
firebase hosting:channel:list
firebase hosting:channels:view CHANNEL_ID
```

### Desplegar con Mensaje Personalizado

```bash
firebase deploy --message "Descripción del cambio"
```

## Estructura de Archivos Importante

```
disgrafia-web/
├── index.html                    # Página principal
├── pages/
│   ├── planes.html
│   ├── estudiantes.html
│   └── reportes.html
├── js/
│   └── planes.js
├── services/
│   └── planes-service.js
├── css/
│   └── planes.css
├── config/
│   └── firebase-config.js       # ⚠️ IMPORTANTE: Actualizar credenciales
├── firebase.json                 # Configuración de hosting
├── .firebaserc                   # Configuración del proyecto
└── package.json                  # Dependencias
```

## Solución de Problemas

### Error: "Project not specified"

Asegúrate de que `.firebaserc` está en la raíz del proyecto y tiene tu ID de proyecto.

### Error: "Cannot find file"

Verifica que los archivos estén en los directorios correctos y que las rutas en HTML sean relativas (no absolutas).

### Error de Credenciales de Firebase

1. Ve a Firebase Console
2. Verifica que Firestore Database está habilitado
3. Actualiza `config/firebase-config.js` con credenciales correctas
4. Comprueba las reglas de seguridad de Firestore

### La página carga pero no ve los datos

1. Verifica las reglas de seguridad de Firestore en Firebase Console
2. Asegúrate de que los datos están en la colección `planes`
3. Revisa la consola del navegador (F12) para errores

## Configuración de Reglas de Seguridad de Firestore

Para que la app funcione correctamente, configura estas reglas en Firebase Console:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir lectura y escritura a usuarios autenticados
    match /planes/{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Permitir lectura pública (opcional)
    match /planes/{document=**} {
      allow read: if true;
    }
  }
}
```

## Actualizar Después del Despliegue

Para actualizar tu sitio después de hacer cambios:

```bash
git add .
git commit -m "Descripción de cambios"
git push origin main
firebase deploy
```

## URLs de Referencia

- 📘 [Documentación Firebase Hosting](https://firebase.google.com/docs/hosting)
- 🔐 [Reglas de Seguridad Firestore](https://firebase.google.com/docs/firestore/security/get-started)
- 🚀 [Firebase CLI Reference](https://firebase.google.com/docs/cli)

---

**¿Necesitas ayuda?** Revisa los logs con `firebase hosting:disable` o contacta al equipo de soporte.
