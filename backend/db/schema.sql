-- Queen Promotoras — Schema SQL
-- Ejecutar en PostgreSQL como usuario con permisos

CREATE DATABASE queen_promotoras;
\c queen_promotoras;

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

-- Insertar admin inicial (password: admin123 — CAMBIAR EN PRODUCCIÓN)
-- password_hash generado con bcrypt rounds=10
INSERT INTO usuarios (nombre, usuario, password_hash, rol)
VALUES ('Propietaria', 'admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');
-- La contraseña del hash de arriba es "password" — cambiar después

