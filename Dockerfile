# syntax=docker/dockerfile:1

# --- Stage 1: Build Frontend ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# --- Stage 2: Production App ---
FROM node:20-alpine AS runner
WORKDIR /app

# Instalar dependencias backend
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

# Copiar código backend
COPY backend/ ./backend/

# Copiar el build estático del frontend al backend para servirlo si se desea o para que Nginx/Dokploy lo exponga
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Exponer el puerto del backend
EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

CMD ["node", "backend/index.js"]
