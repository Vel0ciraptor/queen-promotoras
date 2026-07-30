# Guía de Despliegue en Dokploy con Base de Datos Automática

El proyecto ya incluye un `docker-compose.yml` que crea **la base de datos PostgreSQL** e **inicializa las tablas automáticamente** con `schema.sql`.

---

## Opción RECOMENDADA: Despliegue con Docker Compose en Dokploy

### Paso 1: Crear un servicio Compose en Dokploy
1. Entra a tu panel de **Dokploy**.
2. Selecciona tu **Proyecto** (o crea uno nuevo).
3. Haz clic en **Create Service** y selecciona **Compose**.
4. Nombre del servicio: `queen-promotoras`.

---

### Paso 2: Conectar con GitHub
1. En la configuración del servicio Compose en Dokploy, selecciona **Provider**: `GitHub`.
2. Selecciona tu repositorio: `Vel0ciraptor/queen-promotoras`.
3. Branch: `main`.
4. Compose Path: `./docker-compose.yml` (se detecta automáticamente).

---

### Paso 3: Configurar Variables de Entorno (Opcional pero recomendado)
En la pestaña **Environment / Environment Variables** de Dokploy, puedes personalizar si deseas:

```env
POSTGRES_DB=queen_promotoras
POSTGRES_USER=queen_user
POSTGRES_PASSWORD=tu_contraseña_segura_aqui
DB_HOST=postgres
DB_PORT=5432
DB_NAME=queen_promotoras
DB_USER=queen_user
DB_PASSWORD=tu_contraseña_segura_aqui
JWT_SECRET=tu_jwt_secret_super_largo_y_seguro
```
> *Si no configuras variables, usará las contraseñas por defecto definidas en el `docker-compose.yml`.*

---

### Paso 4: Desplegar
1. Haz clic en el botón **Deploy**.
2. Dokploy ejecutará:
   - Contenedor de PostgreSQL (creará las tablas, usuario y admin inicial automáticamente).
   - Build del frontend React + Backend Express en un solo contenedor.
3. En la pestaña **Domains**, asigna tu dominio o subdominio apuntando al puerto `3001`.

---

## 🔐 Credenciales del Administrador por Defecto
Una vez desplegado:
- **Usuario**: `admin`
- **Contraseña**: `password`
- *(Cámbiala desde el panel de administración al iniciar sesión por primera vez)*
