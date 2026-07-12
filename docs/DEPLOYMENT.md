# Deployment Guide

## Firebase Hosting
1. Configurar proyecto Firebase.
2. Publicar frontend estático.
3. Redireccionar rutas a `index.html`.

## Cloud Functions
- API base en `/api/v1`.
- Configurar variables: `JWT_SECRET`, `CORS_ALLOWED_ORIGINS`.

## CI/CD
- Workflow `test.yml`: verificación sintáctica JS.
- Workflow `deploy.yml`: pipeline de deploy en `main`.
