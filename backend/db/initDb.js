import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './pool.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations() {
  try {
    const { rows } = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'usuarios'
      );
    `);

    const tableExists = rows[0]?.exists;

    if (!tableExists) {
      console.log('📌 Inicializando tablas y esquema en PostgreSQL...');
      const schemaPath = path.join(__dirname, 'schema.sql');
      const sql = fs.readFileSync(schemaPath, 'utf8');
      await pool.query(sql);
      console.log('✅ Esquema inicializado correctamente.');
    } else {
      console.log('ℹ️ Base de datos ya configurada.');
    }
  } catch (err) {
    console.error('⚠️ Error al ejecutar migraciones automáticas:', err);
  }
}
