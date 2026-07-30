# syntax=docker/dockerfile:1

# --- Stage 1: Build Frontend ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# --- Stage 2: Production App ---
FROM node:20-alpine AS runner
WORKDIR /app

# Instalar dependencias backend
COPY backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev

# Copiar código backend
COPY backend/ ./backend/

# Copiar el build estático del frontend al backend
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

CMD ["node", "backend/index.js"]
