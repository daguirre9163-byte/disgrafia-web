# Development Guide

## Setup
1. Servir localmente con `python -m http.server 8000`.
2. Abrir `http://localhost:8000`.
3. Para validación JS: `find . -name '*.js' -print0 | xargs -0 -n1 node --check`.

## Convenciones
- JavaScript modular (ESM).
- Sanitizar entradas antes de renderizar en DOM.
- Mantener respuestas API bajo formato estándar `{ success, data/message }`.

## Flujo Git
- Commits pequeños y atómicos.
- Rama por feature/fix.
