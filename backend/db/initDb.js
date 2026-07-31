import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './pool.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function splitStatements(sql) {
  const statements = [];
  let current = '';
  let inDollarQuote = false;

  for (let i = 0; i < sql.length; i++) {
    if (sql.substring(i, i + 2) === '$$') {
      inDollarQuote = !inDollarQuote;
      current += '$$';
      i++;
      continue;
    }

    if (sql[i] === ';' && !inDollarQuote) {
      const trimmed = current.trim();
      if (trimmed.length > 0 && !trimmed.startsWith('--')) {
        statements.push(trimmed);
      }
      current = '';
    } else {
      current += sql[i];
    }
  }

  const trimmed = current.trim();
  if (trimmed.length > 0 && !trimmed.startsWith('--')) {
    statements.push(trimmed);
  }

  return statements;
}

export async function runMigrations() {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
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
      const statements = splitStatements(sql);

      await client.query('BEGIN');

      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        const preview = stmt.substring(0, 80).replace(/\n/g, ' ');
        try {
          await client.query(stmt + ';');
          console.log(`  ✅ [${i + 1}/${statements.length}] ${preview}...`);
        } catch (err) {
          console.error(`  ❌ [${i + 1}/${statements.length}] Error en: ${preview}...`);
          console.error(`     ${err.message}`);
          throw err;
        }
      }

      await client.query('COMMIT');
      console.log('✅ Esquema inicializado correctamente.');
    } else {
      console.log('ℹ️ Base de datos ya configurada.');
    }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('❌ Error FATAL al ejecutar migraciones:', err.message);
    console.error('   La app no puede funcionar sin las tablas de la base de datos.');
    console.error('   Verifica las variables de entorno DB_* y que PostgreSQL esté accesible.');
  } finally {
    client.release();
  }
}
