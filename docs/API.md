# API Documentation (v1)

Base URL: `/api/v1`

Autenticación: JWT en el encabezado de autorización.

## Endpoints principales
- Auth: `/auth/login`, `/auth/logout`, `/auth/refresh`, `/auth/cambiar-contraseña`
- Docentes: CRUD + `/docentes/{id}/cambiar-rol`
- Estudiantes: CRUD + `/estudiantes/{id}/evaluaciones`
- Evaluaciones: CRUD + `/evaluaciones/estadisticas`
- Reportes: `/reportes/*` + `/reportes/exportar`
- Admin: `/admin/usuarios`, `/admin/instituciones`, `/admin/auditoría`, `/admin/configuración`

## Formato estándar
```json
{
  "success": true,
  "data": {},
  "message": "Operación exitosa"
}
```

```json
{
  "success": false,
  "error": "PERMISSION_DENIED",
  "message": "No tienes permisos para esta acción",
  "statusCode": 403
}
```
