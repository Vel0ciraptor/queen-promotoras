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
      if (trimmed.length > 0) {
        statements.push(trimmed);
      }
      current = '';
    } else {
      current += sql[i];
    }
  }

  const trimmed = current.trim();
  if (trimmed.length > 0) {
    statements.push(trimmed);
  }

  return statements;
}

export async function runMigrations() {
  console.log('🔧 [MIGRACIONES] Iniciando...');
  console.log(`🔧 [MIGRACIONES] DB_HOST=${process.env.DB_HOST || 'NO DEFINIDO'} DB_NAME=${process.env.DB_NAME || 'NO DEFINIDO'} DB_USER=${process.env.DB_USER || 'NO DEFINIDO'} DB_PORT=${process.env.DB_PORT || 'NO DEFINIDO'}`);
  const client = await pool.connect();
  try {
    console.log('🔧 [MIGRACIONES] Conexión a PostgreSQL exitosa');
    const { rows } = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'usuarios'
      );
    `);

    const tableExists = rows[0]?.exists;
    console.log(`🔧 [MIGRACIONES] Tabla usuarios existe: ${tableExists}`);

    if (!tableExists) {
      console.log('📌 Inicializando tablas y esquema en PostgreSQL...');
      const schemaPath = path.join(__dirname, 'schema.sql');
      const sql = fs.readFileSync(schemaPath, 'utf8');
      console.log(`🔧 [MIGRACIONES] schema.sql leído: ${sql.length} caracteres`);
      const statements = splitStatements(sql);
      console.log(`🔧 [MIGRACIONES] ${statements.length} statements separados`);

      await client.query('BEGIN');

      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        const clean = stmt.replace(/^--.*$/gm, '').trim();
        if (!clean) continue;
        const preview = clean.substring(0, 80).replace(/\n/g, ' ');
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
    console.error('❌❌❌ Error FATAL al ejecutar migraciones:', err.message);
    console.error(err.stack);
  } finally {
    client.release();
    console.log('🔧 [MIGRACIONES] Conexión liberada');
  }
}
