-- Queen Promotoras — Schema SQL
-- Se ejecuta automáticamente en la BD inicializada por Docker/PostgreSQL

-- Usuarios del sistema
CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  usuario VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  rol VARCHAR(20) NOT NULL CHECK (rol IN ('admin', 'promotora', 'promotora_lider')),
  creado_por INT REFERENCES usuarios(id),
  activo BOOLEAN DEFAULT true,
  creado_en TIMESTAMP DEFAULT NOW()
);

-- Clientes fidelizados
CREATE TABLE clientes (
  id SERIAL PRIMARY KEY,
  nombre_completo VARCHAR(150) NOT NULL,
  carnet_identidad VARCHAR(30),
  celular VARCHAR(20),
  monto_acumulado DECIMAL(12,2) DEFAULT 0,
  visitas_totales INT DEFAULT 0,
  fecha_registro TIMESTAMP DEFAULT NOW(),
  creado_por INT REFERENCES usuarios(id),
  actualizado_en TIMESTAMP DEFAULT NOW()
);

-- Historial de ingresos (cada compra/visita)
CREATE TABLE historial_ingresos (
  id SERIAL PRIMARY KEY,
  cliente_id INT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  monto DECIMAL(12,2) NOT NULL,
  fecha TIMESTAMP DEFAULT NOW(),
  registrado_por INT REFERENCES usuarios(id),
  nota TEXT
);

-- Auditoría de ediciones admin
CREATE TABLE ediciones_admin (
  id SERIAL PRIMARY KEY,
  cliente_id INT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  admin_id INT NOT NULL REFERENCES usuarios(id),
  campo_modificado VARCHAR(100) NOT NULL,
  valor_anterior TEXT,
  valor_nuevo TEXT,
  comentario TEXT NOT NULL,
  fecha TIMESTAMP DEFAULT NOW()
);

-- Descuentos automáticos
CREATE TABLE descuentos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  porcentaje DECIMAL(5,2) NOT NULL,
  monto_minimo_requerido DECIMAL(12,2) NOT NULL,
  vigencia_valor INT NOT NULL,
  vigencia_unidad VARCHAR(10) NOT NULL CHECK (vigencia_unidad IN ('meses', 'años')),
  duracion_activo_valor INT NOT NULL,
  duracion_activo_unidad VARCHAR(10) NOT NULL CHECK (duracion_activo_unidad IN ('dias', 'meses')),
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  fecha_expiracion TIMESTAMP,
  activo BOOLEAN DEFAULT true
);

-- Notificaciones de descuento por cliente
CREATE TABLE notificaciones_descuento (
  id SERIAL PRIMARY KEY,
  cliente_id INT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  descuento_id INT NOT NULL REFERENCES descuentos(id) ON DELETE CASCADE,
  visto BOOLEAN DEFAULT false,
  fecha TIMESTAMP DEFAULT NOW()
);

-- Trigger: actualizar fecha_expiracion al insertar descuento
CREATE OR REPLACE FUNCTION calcular_fecha_expiracion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.duracion_activo_unidad = 'dias' THEN
    NEW.fecha_expiracion := NEW.fecha_creacion + (NEW.duracion_activo_valor || ' days')::INTERVAL;
  ELSIF NEW.duracion_activo_unidad = 'meses' THEN
    NEW.fecha_expiracion := NEW.fecha_creacion + (NEW.duracion_activo_valor || ' months')::INTERVAL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_fecha_expiracion
BEFORE INSERT ON descuentos
FOR EACH ROW EXECUTE FUNCTION calcular_fecha_expiracion();

-- Trigger: auto-desactivar descuentos expirados al consultar
CREATE OR REPLACE FUNCTION desactivar_descuentos_expirados()
RETURNS void AS $$
BEGIN
  UPDATE descuentos
  SET activo = false
  WHERE activo = true AND fecha_expiracion IS NOT NULL AND fecha_expiracion < NOW();
END;
$$ LANGUAGE plpgsql;

-- Insertar admin inicial (password: qu33nstyl3*2026)
-- password_hash generado con bcrypt ( rounds = 10 )
INSERT INTO usuarios (nombre, usuario, password_hash, rol)
VALUES ('Propietaria', 'admin', '$2a$10$liwH53ANOwHSY0IVUr7C.ubho4kYPGHHVmB81zX68Z8KT5H8eTdre', 'admin');

-- ── Ranking: Tabla de coronas ──────────────────────────────────
CREATE TABLE IF NOT EXISTS coronas (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL,
  monto_minimo DECIMAL(12,2) NOT NULL,
  color_claro VARCHAR(30) NOT NULL,
  color_oscuro VARCHAR(30) NOT NULL,
  icono VARCHAR(10) DEFAULT '👑',
  orden INT NOT NULL DEFAULT 0
);

-- Seed de las 7 coronas (montos acumulados)
INSERT INTO coronas (nombre, monto_minimo, color_claro, color_oscuro, icono, orden) VALUES
('Rosa Suave',    500,    '#FFD1E3', '#FF6FA5', '👑', 1),
('Rosa Vibrante', 1000,   '#FF6FA5', '#FF3D8F', '👑', 2),
('Rosa Intensa',  2000,   '#FF3D8F', '#e0007b', '👑', 3),
('Bronce Rosa',   3500,   '#CD7F6B', '#E8967E', '👑', 4),
('Plata Rosa',    5000,   '#D4A0B0', '#C0C0C0', '👑', 5),
('Oro Rosa',      7500,   '#F4C95D', '#FF6FA5', '👑', 6),
('Platinum Rosa', 10000,  '#E5E4E2', '#FFB6C1', '💎', 7);

-- ── Ranking: Alertas de descuento para promotoras ──────────────
CREATE TABLE IF NOT EXISTS alertas_descuento (
  id SERIAL PRIMARY KEY,
  cliente_id INT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  descuento_id INT NOT NULL REFERENCES descuentos(id) ON DELETE CASCADE,
  promotora_id INT REFERENCES usuarios(id),
  monto_faltante DECIMAL(12,2) NOT NULL,
  porcentaje_descuento DECIMAL(5,2) NOT NULL,
  nombre_descuento VARCHAR(100),
  enviada BOOLEAN DEFAULT false,
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  fecha_enviada TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_alertas_cliente ON alertas_descuento(cliente_id);
CREATE INDEX IF NOT EXISTS idx_alertas_promotora ON alertas_descuento(promotora_id);
CREATE INDEX IF NOT EXISTS idx_alertas_enviada ON alertas_descuento(enviada);

-- ── Campo distancia de alerta para descuentos ──────────────────
ALTER TABLE descuentos ADD COLUMN IF NOT EXISTS alerta_distancia DECIMAL(12,2) DEFAULT 0;
ALTER TABLE descuentos ADD COLUMN IF NOT EXISTS alertas_activas BOOLEAN DEFAULT true;

