# 📘 Guía Didáctica Digital para Disgrafía - SIGEDIS

## Descripción del Proyecto

**SIGEDIS** es una plataforma web integral diseñada para docentes del Sistema Educativo Ecuatoriano que necesitan gestionar, evaluar y hacer seguimiento de estudiantes con **disgrafía** (dificultad específica en la escritura).

### Características Principales

✅ **Autenticación y Seguridad**
- Login con Firebase Authentication
- Gestión de roles y permisos
- Protección de rutas

✅ **Gestión de Estudiantes**
- Registro y perfil de estudiantes
- Clasificación por tipo de disgrafía
- Seguimiento individual

✅ **Constructor de Currículos**
- Drag & drop de actividades
- Personalización por nivel educativo
- Exportación a PDF

✅ **Sistema de Evaluación**
- Registro de evaluaciones
- Cálculo de promedios
- Generación de reportes

✅ **Centro de Recursos**
- Biblioteca de guías metodológicas
- Videos y tutoriales
- Herramientas TIC recomendadas

✅ **FASE 2 - Reportes + Notificaciones + UX**
- Módulo `reportes` con exportación PDF/Excel/CSV
- Centro de notificaciones (toast + campana en navbar)
- Dashboard con KPIs avanzados y comparativas mensuales
- Wizard de 3 pasos para evaluaciones
- Analytics básico de interacción y tiempo por página

✅ **Guías por Nivel Educativo**
- Educación Inicial
- Básica Elemental
- Básica Media
- Básica Superior
- Bachillerato
- Educación Especial

## Stack Tecnológico

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **UI Framework**: Bootstrap 5
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Persistencia Local**: LocalStorage
- **Exportación**: jsPDF, html2canvas
- **Gráficos**: Chart.js
- **Iconos**: Bootstrap Icons

## Instalación

### Requisitos
- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Conexión a internet
- Cuenta Firebase (opcional, para sincronización online)

### Pasos

1. **Clonar el repositorio**
```bash
git clone https://github.com/daguirre9163-byte/disgrafia-web.git
cd disgrafia-web
```

2. **Servir localmente**
```bash
python -m http.server 8000
# o
npx serve
```

3. **Acceder a la aplicación**
```
http://localhost:8000
```

## Uso de la Plataforma

### 1. Inicio de Sesión
- Accede con credenciales Firebase
- Si no tienes cuenta, regístrate como docente

### 2. Dashboard
- Visualiza resumen de estudiantes y evaluaciones
- Accede a actividades recientes

### 3. Gestión de Estudiantes
- Crea nuevos estudiantes
- Clasifica por nivel y tipo de disgrafía
- Visualiza perfil individual

### 4. Constructor de Currículos
- Arrastra actividades al área de construcción
- Personaliza por nivel educativo
- Exporta a PDF

### 5. Evaluación
- Registra evaluaciones de estudiantes
- Genera reportes automáticos
- Visualiza gráficos de progreso

### 6. Recursos
- Accede a videos, PDFs y guías
- Filtra por tipo de disgrafía
- Descarga materiales

## Estructura de Carpetas

```
disgrafia-web/
├── assets/              # Imágenes y recursos multimedia
├── components/          # Componentes reutilizables
│   ├── sidebar/        # Navegación lateral
│   └── navbar/         # Barra superior
├── modules/            # Módulos funcionales
│   ├── dashboard/      # Panel principal
│   ├── estudiantes/    # Gestión de estudiantes
│   ├── reportes/       # Reportería avanzada
│   ├── actividades/    # Gestión de actividades
│   ├── recursos/       # Biblioteca de recursos
│   ├── guias/          # Biblioteca de guías
│   └── seguimiento/    # Seguimiento de progreso
├── niveles/            # Guías por nivel educativo
├── css/                # Estilos
├── js/                 # Lógica JavaScript
│   ├── analytics.js    # Rastreo de uso
│   └── notificaciones.js # Toasts + centro
├── firebase/           # Configuración Firebase
├── constructor.html    # Constructor de currículos
├── evaluacion.html     # Sistema de evaluación
└── recursos.html       # Centro de recursos
```

## Características Avanzadas

### Tema Oscuro/Claro
- Botón en navbar para cambiar tema
- Preferencia guardada en localStorage

### Exportación a PDF
- Currículos con formato profesional
- Reportes de evaluación
- Guías metodológicas imprimibles

### Exportación FASE 2
- `jsPDF` para reportes visuales
- `xlsx` para análisis en hojas de cálculo
- `papaparse` para exportación/importación CSV

### Accesibilidad
- Skip links para navegación por teclado
- Roles ARIA en componentes
- Contraste suficiente entre colores

## Configuración de Firebase

Si deseas conectar tu propia instancia de Firebase:

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com)
2. Actualiza `firebase/firebase-config.js` con tus credenciales
3. Habilita autenticación por email/password
4. Crea base de datos Firestore
5. Define reglas de seguridad

### Estructura de colecciones (FASE 1 MVP)

- `usuarios`: perfil, rol y estado del usuario autenticado.
- `cursos`: cursos creados por docente con relación de estudiantes.
- `estudiantes`: ficha de estudiantes con tipo de disgrafía y curso.
- `evaluaciones`: evaluaciones históricas por estudiante y curso.
- `actividades`: actividades y recursos pedagógicos por nivel.

### Reglas de seguridad recomendadas

Se incluye un ejemplo base en:

- `firebase/reglas.firestore`

Este archivo contempla:

- Solo usuarios autenticados pueden acceder a datos.
- `admin` puede gestionar toda la información.
- `docente` solo puede gestionar documentos asociados a su `docenteId`.

### Validaciones implementadas

El archivo `js/validaciones.js` centraliza validaciones de:

- Correo electrónico (formato y duplicidad en Firestore).
- Contraseña segura (mínimo 8 caracteres, mayúscula y número).
- Cédula ecuatoriana (10 dígitos con verificador).
- Teléfono ecuatoriano (10 dígitos iniciando con `0`).

## Contribución

Este proyecto es de código abierto. Para contribuir:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo licencia MIT. Ver `LICENSE` para más detalles.

## Soporte

Para reportar bugs o sugerir mejoras, abre un [Issue](https://github.com/daguirre9163-byte/disgrafia-web/issues).

## Autores

- **Darwin Fernando Aguirre Barcia** - Desarrollo principal
- **Copilot** - Asistencia en desarrollo

## Agradecimientos

- Bootstrap por el framework CSS
- Firebase por la plataforma backend
- Comunidad educativa ecuatoriana por el feedback

---

**© 2026 - Guía Didáctica Digital para la Atención de Disgrafía**
*Educación Inclusiva para Todos*