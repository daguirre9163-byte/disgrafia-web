# Architecture

## Frontend
- SPA modular basada en `dashboard.html` + `js/router.js`.
- Panel admin desacoplado en `/admin/*`.
- PWA con `public/service-worker.js` y `public/app.webmanifest`.

## Backend (API)
- Estructura en `api/` por capas:
  - `routes/`
  - `middleware/`
  - `services/`
  - `utils/`
- Dispatcher en `api/index.js`.

## Seguridad
- JWT (access + refresh).
- Rate limiting por usuario/IP.
- Sanitización básica de inputs.
- Registro de auditoría.
