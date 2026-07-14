# ✅ Checklist Pre-Despliegue - Disgrafia Web

## Antes de Desplegar a Firebase Hosting

Asegúrate de completar todos los pasos antes de ejecutar `firebase deploy`.

---

## 📋 Checklist Técnico

### 1. Configuración de Firebase

- [ ] Cuenta de Firebase creada en [console.firebase.google.com](https://console.firebase.google.com)
- [ ] Proyecto creado en Firebase Console
- [ ] Firestore Database habilitado
- [ ] Credenciales obtenidas desde "Configuración del Proyecto"
- [ ] `config/firebase-config.js` actualizado con credenciales reales
- [ ] `.firebaserc` contiene el ID correcto del proyecto

### 2. Archivos y Estructura

- [ ] `index.html` existe en la raíz
- [ ] `pages/planes.html` existe
- [ ] `pages/estudiantes.html` existe (si está implementado)
- [ ] `pages/reportes.html` existe (si está implementado)
- [ ] Todos los archivos CSS en carpeta `css/`
- [ ] Todos los archivos JS en carpeta `js/`
- [ ] Todos los servicios en carpeta `services/`
- [ ] Configuración en carpeta `config/`

### 3. Rutas y URLs

- [ ] Todas las rutas de archivos son relativas (ej: `./css/`, `../pages/`)
- [ ] No hay rutas absolutas (ej: `/css/` ❌)
- [ ] Los imports en JS usan rutas correctas
- [ ] Los links en HTML usan rutas correctas

### 4. Firebase CLI

- [ ] Node.js instalado (versión 14+)
- [ ] Firebase CLI instalado globalmente (`firebase --version` funciona)
- [ ] Autenticado en Firebase (`firebase login`)
- [ ] `firebase.json` existe en la raíz
- [ ] `.firebaserc` existe con proyecto correcto

### 5. Código JavaScript

- [ ] No hay errores en la consola (F12)
- [ ] Todos los módulos importan correctamente
- [ ] No hay referencias a variables globales no definidas
- [ ] Funciones async/await manejan errores
- [ ] Console.logs son útiles (no dejar spam)

### 6. Seguridad Firestore

- [ ] Reglas de Firestore configuradas en Firebase Console:
  ```
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /planes/{document=**} {
        allow read, write: if request.auth != null;
      }
    }
  }
  ```
- [ ] Base de datos no está en modo "Modo de prueba" para producción
- [ ] Índices de Firestore creados si es necesario

### 7. Variables de Entorno

- [ ] No hay API keys expuestas en código frontend innecesariamente
- [ ] Credenciales de Firebase son solo lectura/escritura apropiadas
- [ ] No hay datos sensibles en archivos estáticos

---

## 🎨 Checklist de Interfaz

- [ ] Página se ve bien en escritorio
- [ ] Página se ve bien en tablet
- [ ] Página se ve bien en móvil
- [ ] Todos los botones funcionan
- [ ] Modales se abren y cierran correctamente
- [ ] Formularios validan datos
- [ ] Mensajes de notificación aparecen
- [ ] Navbar se ve correctamente
- [ ] Sidebar es navegable

---

## ✨ Checklist de Funcionalidad

### Planes de Intervención
- [ ] Crear nuevo plan funciona
- [ ] Ver lista de planes funciona
- [ ] Editar plan funciona
- [ ] Eliminar plan funciona
- [ ] Duplicar plan funciona
- [ ] Exportar plan a JSON funciona
- [ ] Importar plan desde JSON funciona

### Objetivos
- [ ] Agregar objetivo funciona
- [ ] Eliminar objetivo funciona
- [ ] Los objetivos se guardan en Firestore

### Actividades
- [ ] Agregar actividad funciona
- [ ] Marcar actividad completada funciona
- [ ] Eliminar actividad funciona
- [ ] El progreso se calcula correctamente
- [ ] Las actividades se ordenan correctamente

### Seguimiento
- [ ] Agregar registro de seguimiento funciona
- [ ] Se guardan las notas
- [ ] Las estadísticas se actualizan
- [ ] El historial de cambios se mantiene

### Notas
- [ ] Guardar notas del plan funciona
- [ ] Las notas persisten después de recargar

---

## 🔐 Checklist de Seguridad

- [ ] No hay contraseñas en el código
- [ ] No hay tokens expuestos
- [ ] No hay información sensible visible
- [ ] Firebase Security Rules están configuradas
- [ ] CORS está correctamente configurado (si es necesario)
- [ ] Validación de entrada en formularios

---

## 📊 Checklist de Rendimiento

- [ ] Página carga en menos de 3 segundos
- [ ] No hay archivos muy grandes sin comprimir
- [ ] Bootstrap CDN se carga correctamente
- [ ] Las imágenes están optimizadas
- [ ] No hay fugas de memoria en la consola
- [ ] Las consultas a Firestore son eficientes

---

## 📝 Checklist de Documentación

- [ ] README.md está actualizado
- [ ] DEPLOYMENT.md contiene instrucciones claras
- [ ] Código tiene comentarios útiles
- [ ] Funciones están documentadas
- [ ] Variables tienen nombres descriptivos

---

## 🚀 Pasos Finales Antes de Desplegar

### Local Testing (Última verificación)

```bash
# 1. Servir localmente
npm start
# o
firebase serve

# 2. Abrir en navegador
# http://localhost:5000

# 3. Probar todas las funciones principales
# 4. Abrir consola (F12) y verificar no hay errores
# 5. Verificar que los datos se guardan en Firestore
```

### Backup y Control de Versiones

```bash
# 1. Hacer commit de cambios
git add .
git commit -m "Pre-deployment verification complete"

# 2. Crear etiqueta (opcional)
git tag -a v1.0.0 -m "Version 1.0.0 - Initial deployment"

# 3. Hacer push
git push origin main
git push origin --tags
```

### Despliegue

```bash
# Opción 1: Usar script
chmod +x deploy.sh
./deploy.sh "Despliegue inicial"

# Opción 2: Comando directo
firebase deploy --message "Despliegue inicial"
```

---

## ✅ Post-Despliegue

Una vez desplegado, verifica:

- [ ] URL de Firebase es accesible
- [ ] Página carga correctamente en producción
- [ ] Todas las funciones principales funcionan
- [ ] No hay errores en la consola del navegador
- [ ] Datos se guardan en Firestore correctamente
- [ ] Rendimiento es aceptable

---

## 📞 En Caso de Problemas

### El sitio no carga
- Verificar que `index.html` está en la raíz
- Revisar `firebase.json` - propiedad `public`
- Ver logs: `firebase hosting:channels:list`

### Datos no se guardan
- Verificar credenciales en `firebase-config.js`
- Revisar reglas de Firestore en Firebase Console
- Abrir consola (F12) para ver errores específicos

### Estilos no cargan
- Verificar rutas de CSS (deben ser relativas)
- Limpiar caché del navegador (Ctrl+Shift+Del)
- Verificar que archivos CSS no están siendo ignorados en `firebase.json`

### JavaScript no funciona
- Revisar imports de módulos
- Verificar que `firebase-config.js` está correcto
- Ver errores en consola (F12)

---

## 📋 Estado del Despliegue

```
Fecha de última verificación: _______________
Realizado por: _______________
Estado: [ ] Listo para desplegar [ ] Requiere ajustes
Notas:
_____________________________________________________________
_____________________________________________________________
```

---

**¡Recuerda!** Siempre prueba completamente antes de desplegar a producción. 🚀
