import express from 'express';
import pool from '../db/pool.js';
import { authMiddleware, requireRol } from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);

// Desactivar descuentos expirados en cada llamada
async function limpiarDescuentos() {
  await pool.query(`UPDATE descuentos SET activo = false WHERE activo = true AND fecha_expiracion IS NOT NULL AND fecha_expiracion < NOW()`);
}

// GET /api/clientes?q=&page=1&limit=7
router.get('/', async (req, res) => {
  await limpiarDescuentos();
  const { q = '', page = 1, limit = 7 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const search = `%${q}%`;

  try {
    const { rows } = await pool.query(
      `SELECT c.*,
        u.nombre AS creado_por_nombre,
        (SELECT COUNT(*) FROM notificaciones_descuento nd 
         JOIN descuentos d ON nd.descuento_id = d.id
         WHERE nd.cliente_id = c.id AND d.activo = true AND nd.visto = false) AS descuentos_activos
       FROM clientes c
       LEFT JOIN usuarios u ON c.creado_por = u.id
       WHERE c.nombre_completo ILIKE $1 OR c.carnet_identidad ILIKE $1 OR c.celular ILIKE $1
       ORDER BY c.fecha_registro DESC
       LIMIT $2 OFFSET $3`,
      [search, limit, offset]
    );

    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*) FROM clientes WHERE nombre_completo ILIKE $1 OR carnet_identidad ILIKE $1 OR celular ILIKE $1`,
      [search]
    );

    res.json({ clientes: rows, total: parseInt(countRows[0].count) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/clientes/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.*, u.nombre AS creado_por_nombre FROM clientes c LEFT JOIN usuarios u ON c.creado_por = u.id WHERE c.id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Cliente no encontrado' });

    const { rows: historial } = await pool.query(
      `SELECT h.*, u.nombre AS registrado_por_nombre FROM historial_ingresos h LEFT JOIN usuarios u ON h.registrado_por = u.id WHERE h.cliente_id = $1 ORDER BY h.fecha DESC`,
      [req.params.id]
    );

    res.json({ cliente: rows[0], historial });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/clientes/import — importar clientes desde Excel (batch)
router.post('/import', requireRol('admin'), async (req, res) => {
  const { clientes } = req.body;
  if (!Array.isArray(clientes) || clientes.length === 0) {
    return res.status(400).json({ error: 'Se requiere un array de clientes' });
  }

  const client = await pool.connect();
  const resultados = { importadas: 0, errores: [], columnas_detectadas: [] };

  // Normalizar keys del Excel: trim + lowercase para buscar por sinónimos
  function normalizeRow(row) {
    const norm = {};
    for (const [key, val] of Object.entries(row)) {
      norm[key.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')] = val;
      norm[key.trim()] = val; // also keep original trimmed
    }
    return norm;
  }

  function findVal(row, ...candidates) {
    for (const c of candidates) {
      if (row[c] !== undefined && row[c] !== null && String(row[c]).trim() !== '') return String(row[c]).trim();
    }
    return null;
  }

  try {
    await client.query('BEGIN');

    for (let i = 0; i < clientes.length; i++) {
      const raw = clientes[i];
      const row = normalizeRow(raw);

      if (i === 0) {
        resultados.columnas_detectadas = Object.keys(raw);
      }

      const nombre = findVal(row,
        'nombre', 'nombrecompleto', 'nombre_completo', 'nombre completo',
        'nombre completo', 'nombres'
      );
      if (!nombre) {
        resultados.errores.push({ fila: i + 1, error: 'Nombre vacío' });
        continue;
      }

      const telefono = findVal(row,
        'telefono', 'teléfono', 'celular', 'cel', 'tel', 'movil', 'móvil', 'phone'
      );
      const ci = findVal(row,
        'ci', 'c.i', 'c.i.', 'carnet', 'carnetidentidad', 'carnet identidad', 'carnet de identidad', 'cedula', 'cedula', 'dni'
      );
      const montoCompra = parseFloat(findVal(row, 'monto', 'monto de compra', 'montodecompra', 'monto_compra', 'total', 'compra') || 0) || 0;
      const vecesCompradas = parseInt(findVal(row, 'veces que compro', 'vecesquecompro', 'veces_compradas', 'veces compradas', 'visitas', 'compras', 'totalcompras') || 0) || 0;
      const fechaRegistro = findVal(row, 'fecha de registro', 'fechaderegistro', 'fecha_registro', 'fecha', 'fechacompra', 'fecha de compra');

      let fechaISO = null;
      if (fechaRegistro) {
        const d = new Date(fechaRegistro);
        if (!isNaN(d.getTime())) fechaISO = d.toISOString();
      }

      try {
        const { rows } = await client.query(
          `INSERT INTO clientes (nombre_completo, carnet_identidad, celular, monto_acumulado, visitas_totales, fecha_registro, creado_por)
           VALUES ($1, $2, $3, $4, $5, COALESCE($6, NOW()), $7) RETURNING *`,
          [nombre, ci, telefono, montoCompra, vecesCompradas, fechaISO, req.user.id]
        );

        const cliente = rows[0];

        if (montoCompra > 0) {
          await client.query(
            `INSERT INTO historial_ingresos (cliente_id, monto, registrado_por, fecha)
             VALUES ($1, $2, $3, COALESCE($4, NOW()))`,
            [cliente.id, montoCompra, req.user.id, fechaISO]
          );
        }

        try {
          await verificarDescuentos(client, cliente, montoCompra);
        } catch (descErr) {
          console.error(`⚠️ Error verificando descuentos para fila ${i + 1}:`, descErr.message);
        }
        resultados.importadas++;
      } catch (err) {
        console.error(`❌ Error en fila ${i + 1} (${nombre}):`, err.message);
        resultados.errores.push({ fila: i + 1, nombre, error: err.message });
      }
    }

    await client.query('COMMIT');
    res.json(resultados);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌❌❌ Error FATAL en importación:', err.message);
    console.error(err.stack);
    res.status(500).json({ error: 'Error del servidor durante la importación', details: err.message });
  } finally {
    client.release();
  }
});

// POST /api/clientes
router.post('/', async (req, res) => {
  const { nombre_completo, carnet_identidad, celular, monto_inicial = 0 } = req.body;
  if (!nombre_completo) return res.status(400).json({ error: 'Nombre requerido' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `INSERT INTO clientes (nombre_completo, carnet_identidad, celular, monto_acumulado, visitas_totales, creado_por)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [nombre_completo, carnet_identidad || null, celular || null, monto_inicial, monto_inicial > 0 ? 1 : 0, req.user.id]
    );

    const cliente = rows[0];

    if (monto_inicial > 0) {
      await client.query(
        `INSERT INTO historial_ingresos (cliente_id, monto, registrado_por) VALUES ($1, $2, $3)`,
        [cliente.id, monto_inicial, req.user.id]
      );
    }

    // Verificar si alcanza algún descuento activo
    await verificarDescuentos(client, cliente, monto_inicial);

    await client.query('COMMIT');
    res.status(201).json({ cliente });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  } finally {
    client.release();
  }
});

// POST /api/clientes/:id/ingreso — registrar nueva compra/visita
router.post('/:id/ingreso', async (req, res) => {
  const { monto, nota } = req.body;
  if (!monto || monto <= 0) return res.status(400).json({ error: 'Monto inválido' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO historial_ingresos (cliente_id, monto, registrado_por, nota) VALUES ($1, $2, $3, $4)`,
      [req.params.id, monto, req.user.id, nota || null]
    );

    const { rows } = await client.query(
      `UPDATE clientes SET monto_acumulado = monto_acumulado + $1, visitas_totales = visitas_totales + 1, actualizado_en = NOW()
       WHERE id = $2 RETURNING *`,
      [monto, req.params.id]
    );

    const cliente = rows[0];

    // Verificar descuentos
    const nuevas = await verificarDescuentos(client, cliente, monto);

    await client.query('COMMIT');
    res.json({ cliente, nuevas_notificaciones: nuevas });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  } finally {
    client.release();
  }
});

// PUT /api/clientes/:id — solo admin, requiere comentario
router.put('/:id', requireRol('admin'), async (req, res) => {
  const { nombre_completo, carnet_identidad, celular, comentario } = req.body;
  if (!comentario || comentario.trim().length < 3) {
    return res.status(400).json({ error: 'El comentario es obligatorio para editar' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: prev } = await client.query('SELECT * FROM clientes WHERE id = $1', [req.params.id]);
    if (!prev.length) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'No encontrado' }); }
    const old = prev[0];

    const campos = { nombre_completo, carnet_identidad, celular };
    for (const [campo, valor] of Object.entries(campos)) {
      if (valor !== undefined && valor !== old[campo]) {
        await client.query(
          `INSERT INTO ediciones_admin (cliente_id, admin_id, campo_modificado, valor_anterior, valor_nuevo, comentario)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [req.params.id, req.user.id, campo, old[campo], valor, comentario]
        );
      }
    }

    const { rows } = await client.query(
      `UPDATE clientes SET
        nombre_completo = COALESCE($1, nombre_completo),
        carnet_identidad = COALESCE($2, carnet_identidad),
        celular = COALESCE($3, celular),
        actualizado_en = NOW()
       WHERE id = $4 RETURNING *`,
      [nombre_completo || null, carnet_identidad || null, celular || null, req.params.id]
    );

    await client.query('COMMIT');
    res.json({ cliente: rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  } finally {
    client.release();
  }
});

// GET /api/clientes/:id/notificaciones
router.get('/:id/notificaciones', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT nd.*, d.nombre AS descuento_nombre, d.porcentaje
       FROM notificaciones_descuento nd
       JOIN descuentos d ON nd.descuento_id = d.id
       WHERE nd.cliente_id = $1 AND d.activo = true
       ORDER BY nd.fecha DESC`,
      [req.params.id]
    );
    res.json({ notificaciones: rows });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// PATCH /api/clientes/:id/notificaciones/visto
router.patch('/:id/notificaciones/visto', async (req, res) => {
  await pool.query(`UPDATE notificaciones_descuento SET visto = true WHERE cliente_id = $1`, [req.params.id]);
  res.json({ ok: true });
});

// Función auxiliar: verificar descuentos alcanzados
async function verificarDescuentos(client, cliente, montoNuevo) {
  const montoTotal = parseFloat(cliente.monto_acumulado);
  const { rows: descuentos } = await client.query(
    `SELECT * FROM descuentos WHERE activo = true AND monto_minimo_requerido <= $1`, [montoTotal]
  );

  let nuevas = [];
  for (const d of descuentos) {
    const { rows: existe } = await client.query(
      `SELECT id FROM notificaciones_descuento WHERE cliente_id = $1 AND descuento_id = $2`, [cliente.id, d.id]
    );
    if (!existe.length) {
      await client.query(
        `INSERT INTO notificaciones_descuento (cliente_id, descuento_id) VALUES ($1, $2)`,
        [cliente.id, d.id]
      );
      nuevas.push(d);
    }
  }
  return nuevas;
}

export default router;
