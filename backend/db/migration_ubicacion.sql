-- ══════════════════════════════════════════════════════════════
-- MIGRACIÓN: Nacionalidad y Departamento de las clientas
-- ══════════════════════════════════════════════════════════════
-- ⚠️  SEGURO PARA EJECUTAR EN UNA BD CON DATOS REALES
--     Usa IF NOT EXISTS: solo agrega 2 columnas nuevas a la tabla
--     clientes. NO borra ni modifica datos existentes.
--
-- 📋 CÓMO EJECUTARLO:
--    Opción A (automático): reiniciar el backend (initDb.js lo detecta)
--    Opción B (psql):  psql -U queen_user -d queen_promotoras -f backend/db/migration_ubicacion.sql
--    Opción C (Docker): docker exec -i <container_postgres> psql -U queen_user -d queen_promotoras < backend/db/migration_ubicacion.sql
-- ══════════════════════════════════════════════════════════════

DO $$
BEGIN
  -- Columna: nacionalidad de la clienta
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clientes' AND column_name = 'nacionalidad'
  ) THEN
    ALTER TABLE clientes ADD COLUMN nacionalidad VARCHAR(30);
  END IF;

  -- Columna: departamento de Bolivia del que viene la clienta/compra
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clientes' AND column_name = 'departamento'
  ) THEN
    ALTER TABLE clientes ADD COLUMN departamento VARCHAR(50);
  END IF;
END $$;

-- ══════════════════════════════════════════════════════════════
-- FIN DE LA MIGRACIÓN
-- ══════════════════════════════════════════════════════════════
