#!/bin/bash
# deploy.sh — Ejecutar en el VPS para actualizar la app
# Uso: bash deploy.sh

set -e

APP_DIR="/var/www/queen-promotoras"

echo "🌸 Desplegando Queen Promotoras..."

cd $APP_DIR

# 1. Traer cambios de git
git pull origin main

# 2. Backend: instalar deps
cd backend
npm install --omit=dev
cd ..

# 3. Frontend: instalar y compilar
cd frontend
npm install
npm run build
cd ..

# 4. Reiniciar backend con PM2
pm2 reload queen-promotoras || pm2 start deploy/ecosystem.config.cjs

echo "✅ Deploy completado"
pm2 status
