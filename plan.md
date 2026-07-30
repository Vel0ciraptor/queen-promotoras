# Plan del Sistema — Queen Style

## 1. Resumen del proyecto

Webapp de fidelización de clientes para "Queen Style" (accesorios). Dos roles con accesos completamente distintos:

- **Admin (propietaria)**: control total — dashboard, métricas, configuración, descuentos, edición de clientes con auditoría.
- **Promotora**: operación diaria simple — buscar, listar y registrar clientes. Interfaz mínima, pensada para usarse parada en el mostrador con el celular.

**Prioridad de diseño**: mobile-first estricto para la vista de promotora (es la que se usa todo el día en el local). El dashboard de admin puede ser más denso/"aburrido" en desktop, pero también debe funcionar en celular sin romperse (la propietaria seguramente revisa desde el teléfono).

---

## 2. Paleta de colores (extraída del flyer)

| Uso | Color | Hex aprox. |
|---|---|---|
| Rosa fuerte / primario (títulos, botones principales) | Rosa chicle intenso | `#FF3D8F` |
| Rosa medio (acentos, hover, iconos) | Rosa vibrante | `#FF6FA5` |
| Rosa pastel (fondos, cards) | Rosa suave | `#FFD1E3` |
| Rosa muy claro (fondo general light mode) | Rosa neblina | `#FFF0F6` |
| Blanco | Texto sobre rosa fuerte, cards | `#FFFFFF` |
| Magenta oscuro (contraste, texto sobre rosa claro) | Magenta profundo | `#B3003D` |
| Dorado (detalles tipo corona, decorativos) | Dorado suave | `#F4C95D` |

### Modo oscuro (dark mode)
| Uso | Hex aprox. |
|---|---|
| Fondo base | `#1A0F16` |
| Superficie / cards | `#2B1420` |
| Rosa primario (se mantiene vibrante sobre oscuro) | `#FF3D8F` |
| Texto principal | `#FFE9F2` |
| Texto secundario | `#D9A8BE` |
| Borde/divisor sutil | `#402030` |

La marca (rosa + corona + brillos) se mantiene como identidad; en dark mode el rosa se conserva como acento sobre fondos oscuros ciruela/vino, no negro puro (para no perder la calidez de la marca).

---

## 3. Roles y permisos

### Admin (propietaria)
- Dashboard con gráficos y totales (fidelizaciones, montos, historial de ingresos)
- Crear cuentas de promotoras
- Configuración (tema claro/oscuro, datos del negocio)
- Editar clientes → **obligatorio dejar comentario** (queda en historial/auditoría, con fecha y quién editó)
- Crear y gestionar descuentos automáticos
- Ver historial completo de movimientos

### Promotora 1 (con permiso extra)
- Las 3 funciones base (búsqueda, lista, alta de cliente)
- Puede crear nuevas cuentas de promotora (con permisos limitados, no puede tocar dashboard/config/descuentos)

### Promotora (general)
Solo 3 bloques, sin nada más visible:
1. **Buscar cliente** (nombre / CI / celular)
2. **Lista de clientes** (máx. 7 visibles + scroll/paginación visual tipo "cargar más")
3. **Agregar nuevo cliente**

---

## 4. Modelo de datos (propuesta)

```
usuarios
  id, nombre, usuario, password_hash, rol [admin|promotora|promotora_lider],
  creado_por, activo, creado_en

clientes
  id, nombre_completo, carnet_identidad, celular,
  monto_acumulado, visitas_totales, fecha_registro,
  creado_por (promotora), actualizado_en

historial_ingresos
  id, cliente_id, monto, fecha, registrado_por (usuario_id), nota

ediciones_admin (auditoría obligatoria)
  id, cliente_id, admin_id, campo_modificado,
  valor_anterior, valor_nuevo, comentario, fecha

descuentos
  id, nombre, porcentaje, monto_minimo_requerido,
  vigencia_valor, vigencia_unidad [meses|años],
  duracion_activo_valor, duracion_activo_unidad [dias|meses],
  fecha_creacion, fecha_expiracion (calculada), activo

notificaciones_descuento
  id, cliente_id, descuento_id, visto, fecha
```

**Lógica clave de descuentos**: al crearlo, el sistema calcula `fecha_expiracion = fecha_creacion + duracion_activo`. Un job (cron o chequeo en cada carga) desactiva automáticamente el descuento cuando pasa esa fecha, sin intervención manual.

---

## 5. Diseño mobile-first — Vista Promotora

Pensada como app de una sola pantalla, sin scroll de navegación, todo con el pulgar:

```
┌─────────────────────────┐
│   Queen Style  (logo)   │ ← header rosa fuerte, fijo
├─────────────────────────┤
│ 🔍 Buscar cliente        │ ← input grande, sticky
│ [Nombre / CI / Celular]  │
├─────────────────────────┤
│ Card cliente 1            │
│ Card cliente 2            │  ← máx 7, cards tipo
│ ...                       │     pill redondeadas
│ Card cliente 7            │
│ [Ver más ▼]                │  ← carga siguientes 7
├─────────────────────────┤
│      + Nuevo cliente      │ ← botón flotante (FAB)
└─────────────────────────┘     rosa fuerte, siempre visible
```

- Botones grandes (mín. 44px táctil), tipografía redondeada acorde al logo.
- Cards de cliente muestran: nombre, monto acumulado, y un badge si tiene descuento activo.
- Formulario de "nuevo cliente" se abre en modal/bottom-sheet (no navega a otra página) para mantener fluidez en celular.

### Aviso de descuento (visual + sonido)
Cuando un cliente alcanza el monto de un descuento:
- Se dispara un **toast/banner** desde arriba con el ícono de corona, color dorado sobre rosa, con texto tipo "¡María alcanzó 15% OFF!"
- Sonido melodioso corto (tipo campanita/chime, 1-2 segundos, no alarmante) — un solo `.mp3` ligero reutilizado.
- La card del cliente queda con un borde/brillo dorado sutil mientras el descuento esté vigente.

---

## 6. Vista Admin (dashboard)

Desktop: layout de dashboard clásico (sidebar + contenido). Mobile: se colapsa a tabs inferiores o menú hamburguesa, gráficos se apilan verticalmente y se vuelven swipeables.

Secciones:
1. **Resumen**: tarjetas de totales (clientes activos, monto total fidelizado, ingresos del mes)
2. **Gráficos**: fidelizaciones en el tiempo, montos por promotora, historial de ingresos (línea/barras)
3. **Clientes**: tabla/lista con edición → modal que **exige comentario** antes de guardar
4. **Descuentos**: crear/editar (nombre, %, monto mínimo, vigencia, duración antes de auto-desaparecer), lista de activos vs expirados
5. **Promotoras**: crear cuentas, ver actividad por promotora
6. **Configuración**: modo claro/oscuro, datos del negocio

---

## 7. Stack técnico sugerido

- **Frontend**: React + Tailwind (variables CSS para el theming claro/oscuro con la paleta de arriba)
- **Gráficos**: Recharts
- **Backend**: Node.js/Express o similar con API REST
- **Base de datos**: PostgreSQL (relacional, buena para auditoría e historial)
- **Auth**: sesiones o JWT, roles vía middleware
- **Sonido**: archivo de audio corto precargado, disparado por evento (Web Audio API o `<audio>` simple)

---

## 8. Fases de desarrollo sugeridas

1. **Fase 1 — Base**: auth, roles, estructura de BD, layout mobile promotora (búsqueda + lista + alta)
2. **Fase 2 — Admin core**: dashboard con totales reales, tabla de clientes editable con auditoría
3. **Fase 3 — Descuentos**: creación, cálculo automático de vigencia/expiración, notificación visual+sonora
4. **Fase 4 — Gráficos y reportes**: historial de ingresos, gráficos por promotora/periodo
5. **Fase 5 — Pulido**: modo oscuro, animaciones, FAB, transiciones mobile, testing en dispositivos reales

---

## 9. Notas de UX minimalistas (promotora)

- Nada de menús ni configuración visible — cero distracciones.
- Un solo color de acción (rosa fuerte) para todos los botones primarios, evita ruido visual.
- Feedback inmediato: al agregar cliente, un pequeño check animado, no un modal de confirmación pesado.