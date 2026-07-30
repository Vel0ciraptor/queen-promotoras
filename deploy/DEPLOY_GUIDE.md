# Guía de Deploy — Queen Promotoras en VPS Hostinger

## PARTE 1: Subir a GitHub

### Paso 1 — Crear repo en GitHub
1. Ve a [github.com/new](https://github.com/new)
2. Nombre: `queen-promotoras`
3. Privado ✅ (recomendado)
4. **No** marques "Add README"
5. Clic en **Create repository**

### Paso 2 — Conectar y subir desde tu PC
Copia la URL del repo (ej: `https://github.com/tu_usuario/queen-promotoras.git`) y ejecuta en la terminal del proyecto:

```bash
git remote add origin https://github.com/TU_USUARIO/queen-promotoras.git
git branch -M main
git push -u origin main
```

---

## PARTE 2: Configurar el VPS Hostinger

### Paso 3 — Conectarte al VPS por SSH
Desde tu PC (PowerShell o terminal):

```bash
ssh root@TU_IP_DEL_VPS
```

La IP y contraseña las encuentras en el panel de Hostinger → VPS → Manage.

---

### Paso 4 — Instalar dependencias en el VPS

```bash
# Actualizar el sistema
apt update && apt upgrade -y

# Instalar Node.js 20 (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verificar
node -v && npm -v

# Instalar PostgreSQL
apt install -y postgresql postgresql-contrib

# Instalar Nginx
apt install -y nginx

# Instalar PM2 (gestor de procesos)
npm install -g pm2

# Instalar Git
apt install -y git
```

---

### Paso 5 — Configurar PostgreSQL

```bash
# Entrar como usuario postgres
sudo -u postgres psql

# Dentro de psql — ejecutar esto:
CREATE USER queen_user WITH PASSWORD 'TU_PASSWORD_SEGURA';
CREATE DATABASE queen_promotoras OWNER queen_user;
GRANT ALL PRIVILEGES ON DATABASE queen_promotoras TO queen_user;
\q

# Aplicar el schema
sudo -u postgres psql -d queen_promotoras -f /var/www/queen-promotoras/backend/db/schema.sql
```

---

### Paso 6 — Clonar el repo en el VPS

```bash
mkdir -p /var/www
cd /var/www
git clone https://github.com/TU_USUARIO/queen-promotoras.git

# Verificar
ls /var/www/queen-promotoras
```

---

### Paso 7 — Configurar el backend (.env)

```bash
cd /var/www/queen-promotoras/backend
nano .env
```

Pega esto (ajusta los valores):

```env
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=queen_promotoras
DB_USER=queen_user
DB_PASSWORD=TU_PASSWORD_SEGURA
JWT_SECRET=pon_aqui_una_cadena_muy_larga_y_aleatoria_32chars_minimo
FRONTEND_URL=http://TU_DOMINIO_O_IP
```

Guarda: `Ctrl+O` → Enter → `Ctrl+X`

---

### Paso 8 — Instalar deps y arrancar backend

```bash
cd /var/www/queen-promotoras/backend
npm install --omit=dev

# Aplicar schema a la BD
sudo -u postgres psql -d queen_promotoras -f db/schema.sql

# Arrancar con PM2
cd /var/www/queen-promotoras
pm2 start deploy/ecosystem.config.cjs
pm2 save
pm2 startup    # ← copia y ejecuta el comando que te muestre
```

---

### Paso 9 — Compilar el frontend

```bash
cd /var/www/queen-promotoras/frontend
npm install
npm run build
# Los archivos compilados quedan en frontend/dist/
```

---

### Paso 10 — Configurar Nginx

```bash
# Copiar la config de nginx
cp /var/www/queen-promotoras/deploy/nginx.conf /etc/nginx/sites-available/queen-promotoras

# Editar y poner tu dominio/IP
nano /etc/nginx/sites-available/queen-promotoras
# → Cambia "TU_DOMINIO_O_IP" por tu IP o dominio real

# Activar el sitio
ln -s /etc/nginx/sites-available/queen-promotoras /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default    # quitar el default

# Probar config y recargar nginx
nginx -t
systemctl reload nginx
```

---

### Paso 11 — Verificar que todo funciona

```bash
# Ver estado del backend
pm2 status
pm2 logs queen-promotoras --lines 20

# Probar la API
curl http://localhost:3001/api/health
# Debe devolver: {"ok":true,"time":"..."}
```

Abre en el navegador: `http://TU_IP`
- Login: `admin` / `password` ← **¡Cambiar esto primero!**

---

## PARTE 3: Dominio + HTTPS (opcional pero recomendado)

Si tienes un dominio apuntando al VPS:

```bash
# Instalar Certbot para SSL gratuito
apt install -y certbot python3-certbot-nginx

# Generar certificado (reemplaza con tu dominio)
certbot --nginx -d tudominio.com

# Auto-renovación (ya se configura solo)
certbot renew --dry-run
```

---

## PARTE 4: Actualizar la app en el futuro

Cada vez que hagas cambios en el código:

```bash
# Desde tu PC: subir cambios a GitHub
git add .
git commit -m "descripción del cambio"
git push

# En el VPS: un solo comando para actualizar todo
cd /var/www/queen-promotoras
bash deploy/deploy.sh
```

---

## Resumen de puertos

| Servicio | Puerto |
|----------|--------|
| Nginx (web pública) | 80 / 443 |
| Backend Node.js | 3001 (interno) |
| PostgreSQL | 5432 (interno) |

> El backend y la BD **no son accesibles desde internet** — solo Nginx expone el puerto 80/443. ✅
