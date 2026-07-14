#!/bin/bash

# 🚀 Script de Despliegue a Firebase Hosting
# Uso: ./deploy.sh [mensaje-opcional]

set -e  # Detener en caso de error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Banner
echo -e "${BLUE}"
echo "╔════════════════════════════════════════╗"
echo "║  🚀 DISGRAFIA WEB - FIREBASE DEPLOY   ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}"

# Verificar si Firebase CLI está instalado
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}❌ Firebase CLI no está instalado.${NC}"
    echo "Instálalo con: npm install -g firebase-tools"
    exit 1
fi

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js no está instalado.${NC}"
    exit 1
fi

# Mostrar versiones
echo -e "${YELLOW}📋 Versiones:${NC}"
echo "  Node.js: $(node --version)"
echo "  Firebase CLI: $(firebase --version)"
echo ""

# Verificar si .firebaserc existe
if [ ! -f ".firebaserc" ]; then
    echo -e "${RED}❌ No se encuentra .firebaserc${NC}"
    echo "Ejecuta: firebase init hosting"
    exit 1
fi

# Verificar si firebase.json existe
if [ ! -f "firebase.json" ]; then
    echo -e "${RED}❌ No se encuentra firebase.json${NC}"
    exit 1
fi

echo -e "${YELLOW}🔍 Verificando estructura del proyecto...${NC}"

# Verificar archivos críticos
REQUIRED_FILES=(
    "index.html"
    "pages/planes.html"
    "config/firebase-config.js"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ Archivo faltante: $file${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ Estructura verificada${NC}"
echo ""

# Mostrar proyecto actual
PROJECT_ID=$(grep -o '"default": "[^"]*"' .firebaserc | cut -d'"' -f4)
echo -e "${YELLOW}📌 Proyecto Firebase: ${BLUE}$PROJECT_ID${NC}"
echo ""

# Confirmación antes de desplegar
echo -e "${YELLOW}⚠️  Estás a punto de desplegar a Firebase Hosting${NC}"
read -p "¿Deseas continuar? (s/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${RED}Despliegue cancelado${NC}"
    exit 1
fi

# Mensaje de despliegue (opcional)
if [ -n "$1" ]; then
    DEPLOY_MSG="$1"
else
    read -p "Descripción del despliegue (opcional): " DEPLOY_MSG
fi

echo ""
echo -e "${BLUE}🔄 Iniciando despliegue...${NC}"
echo ""

# Desplegar
if [ -n "$DEPLOY_MSG" ]; then
    firebase deploy --message "$DEPLOY_MSG"
else
    firebase deploy
fi

# Obtener URL de hosting
echo ""
echo -e "${GREEN}✅ ¡Despliegue completado exitosamente!${NC}"
echo ""
echo -e "${YELLOW}📱 URL de tu sitio:${NC}"
firebase hosting:channel:list 2>/dev/null | grep -E "live|production" || echo "  https://${PROJECT_ID}.firebaseapp.com"

echo ""
echo -e "${BLUE}💡 Próximos pasos:${NC}"
echo "  1. Abre tu navegador y verifica: https://${PROJECT_ID}.firebaseapp.com"
echo "  2. Abre la consola (F12) para verificar que no haya errores"
echo "  3. Prueba todas las funcionalidades principales"
echo ""
echo -e "${GREEN}¡Listo para usar!${NC}"
