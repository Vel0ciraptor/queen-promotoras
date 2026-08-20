-- ══════════════════════════════════════════════════════════════
-- MIGRACIÓN: Ranking de Clientas + Alertas WhatsApp
-- ══════════════════════════════════════════════════════════════
-- ⚠️  ESTE ARCHIVO ES SEGURO PARA EJECUTAR EN UNA BD CON DATOS REALES
--     Usa IF NOT EXISTS para evitar errores si ya se ejecutó antes.
--     NO borra ni modifica datos existentes, solo agrega tablas nuevas
--     y columnas nuevas a tablas existentes.
--
-- 📋 CÓMO EJECUTARLO:
--    Opción A (psql):  psql -U queen_user -d queen_promotoras -f backend/db/migration_ranking.sql
--    Opción B (Docker): docker exec -i <container_postgres> psql -U queen_user -d queen_promotoras < backend/db/migration_ranking.sql
--    Opción C (pgAdmin): Abrir el archivo en Query Tool y ejecutar
--
-- ⚠️  ANTES DE EJECUTAR: Haz backup de tu BD
--    pg_dump -U queen_user queen_promotoras > backup_antes_ranking.sql
-- ══════════════════════════════════════════════════════════════

-- 1. Tabla de coronas (catálogo de los 7 niveles)
CREATE TABLE IF NOT EXISTS coronas (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL,
  monto_minimo DECIMAL(12,2) NOT NULL,
  color_claro VARCHAR(30) NOT NULL,
  color_oscuro VARCHAR(30) NOT NULL,
  icono VARCHAR(10) DEFAULT '👑',
  orden INT NOT NULL DEFAULT 0
);

-- 2. Insertar las 7 coronas (solo si la tabla está vacía)
INSERT INTO coronas (nombre, monto_minimo, color_claro, color_oscuro, icono, orden)
SELECT * FROM (VALUES
  ('Rosa Suave',    500,    '#FFD1E3', '#FF6FA5', '👑', 1),
  ('Rosa Vibrante', 1000,   '#FF6FA5', '#FF3D8F', '👑', 2),
  ('Rosa Intensa',  2000,   '#FF3D8F', '#e0007b', '👑', 3),
  ('Bronce Rosa',   3500,   '#CD7F6B', '#E8967E', '👑', 4),
  ('Plata Rosa',    5000,   '#D4A0B0', '#C0C0C0', '👑', 5),
  ('Oro Rosa',      7500,   '#F4C95D', '#FF6FA5', '👑', 6),
  ('Platinum Rosa', 10000,  '#E5E4E2', '#FFB6C1', '💎', 7)
) AS v(nombre, monto_minimo, color_claro, color_oscuro, icono, orden)
WHERE NOT EXISTS (SELECT 1 FROM coronas LIMIT 1);

-- 3. Tabla de alertas de descuento para promotoras
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

-- 4. Índices para performance
CREATE INDEX IF NOT EXISTS idx_alertas_cliente ON alertas_descuento(cliente_id);
CREATE INDEX IF NOT EXISTS idx_alertas_promotora ON alertas_descuento(promotora_id);
CREATE INDEX IF NOT EXISTS idx_alertas_enviada ON alertas_descuento(enviada);

-- 5. Nuevas columnas en la tabla descuentos (NO borra las existentes)
DO $$
BEGIN
  -- Columna: distancia de alerta (a cuántos Bs. antes alertar)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'descuentos' AND column_name = 'alerta_distancia') THEN
    ALTER TABLE descuentos ADD COLUMN alerta_distancia DECIMAL(12,2) DEFAULT 0;
  END IF;

  -- Columna: si las alertas están activas para este descuento
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'descuentos' AND column_name = 'alertas_activas') THEN
    ALTER TABLE descuentos ADD COLUMN alertas_activas BOOLEAN DEFAULT true;
  END IF;
END $$;

-- ══════════════════════════════════════════════════════════════
-- FIN DE LA MIGRACIÓN
-- Si todo salió bien, verás las tablas coronas y alertas_descuento
-- y las columnas alerta_distancia y alertas_activas en descuentos.
-- ══════════════════════════════════════════════════════════════
