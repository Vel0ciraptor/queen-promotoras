# Queen Promotoras 🌸

Sistema de fidelización de clientes para Queen Style.

## Estructura

```
backend/    → API Node.js/Express + PostgreSQL
frontend/   → React + Tailwind (Vite)
```

## Setup rápido

### 1. PostgreSQL
```sql
-- Crear la base de datos y tablas:
psql -U postgres -f backend/db/schema.sql
```

### 2. Backend
```
cd backend
cp .env.example .env     # → editar con tu contraseña de Postgres
npm install
npm run dev              # corre en http://localhost:3001
```

### 3. Frontend
```
cd frontend
npm install
npm run dev              # corre en http://localhost:5173
```

## Credenciales iniciales
- **Admin**: usuario `admin`, contraseña `password`
  > ⚠️ Cambiar la contraseña en producción — ver `schema.sql`

## Roles
| Rol | Acceso |
|-----|--------|
| `admin` | Dashboard completo, edición con auditoría, descuentos, promotoras |
| `promotora_lider` | Vista promotora + puede crear cuentas de promotoras |
| `promotora` | Solo buscar, listar y crear clientes |

## Fases completadas
- ✅ Fase 1: Auth, roles, BD, vista promotora mobile
- ✅ Fase 2: Dashboard admin, tabla clientes con auditoría
- ✅ Fase 3: Descuentos automáticos con notificación visual+sonora
- ✅ Fase 4: Gráficos Recharts (ingresos, fidelizaciones, por promotora)
- 🔜 Fase 5: Pulido final, testing en dispositivos
