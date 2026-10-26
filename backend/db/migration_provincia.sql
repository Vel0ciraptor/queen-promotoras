-- ══════════════════════════════════════════════════════════════
-- MIGRACIÓN: Provincia / Localidad de las clientas
-- ══════════════════════════════════════════════════════════════
-- ⚠️  SEGURO PARA EJECUTAR EN UNA BD CON DATOS REALES
--     Usa IF NOT EXISTS: solo agrega 1 columna nueva a la tabla
--     clientes. NO borra ni modifica datos existentes.
--
-- 📋 CÓMO EJECUTARLO:
--    Opción A (automático): reiniciar el backend (initDb.js lo detecta)
--    Opción B (psql):  psql -U queen_user -d queen_promotoras -f backend/db/migration_provincia.sql
--    Opción C (Docker): docker exec -i <container_postgres> psql -U queen_user -d queen_promotoras < backend/db/migration_provincia.sql
-- ══════════════════════════════════════════════════════════════

DO $$
BEGIN
  -- Columna: provincia / localidad (ej. Yacuiba, Camiri, Villa Tunari)
  -- de Bolivia del que viene la clienta/compra
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clientes' AND column_name = 'provincia'
  ) THEN
    ALTER TABLE clientes ADD COLUMN provincia VARCHAR(80);
  END IF;
END $$;

-- ══════════════════════════════════════════════════════════════
-- FIN DE LA MIGRACIÓN
-- ══════════════════════════════════════════════════════════════
