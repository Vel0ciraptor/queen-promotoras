import express from 'express';
import pool from '../db/pool.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);

// GET /api/ranking — Top clientas por monto acumulado (global)
router.get('/', async (req, res) => {
  try {
    let coronas = [];
    try {
      const coronasRes = await pool.query('SELECT * FROM coronas ORDER BY orden ASC');
      coronas = coronasRes.rows;
    } catch { /* tabla coronas no existe aún */ }

    const { rows: clientas } = await pool.query(
      `SELECT c.id, c.nombre_completo, c.celular, c.monto_acumulado, c.visitas_totales, c.fecha_registro,
              u.nombre AS creado_por_nombre,
              (SELECT COUNT(*) FROM notificaciones_descuento nd
               JOIN descuentos d ON nd.descuento_id = d.id
               WHERE nd.cliente_id = c.id AND d.activo = true) AS descuentos_activos
       FROM clientes c
       LEFT JOIN usuarios u ON c.creado_por = u.id
       ORDER BY c.monto_acumulado DESC
       LIMIT 50`
    );

    const clientasConCorona = clientas.map((c, idx) => {
      const monto = parseFloat(c.monto_acumulado);
      let corona = null;
      for (let i = coronas.length - 1; i >= 0; i--) {
        if (monto >= parseFloat(coronas[i].monto_minimo)) {
          corona = coronas[i];
          break;
        }
      }
      return { ...c, posicion: idx + 1, corona };
    });

    res.json({ clientas: clientasConCorona, coronas });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/ranking/mi-equipo — Solo clientas registradas por la promotora logueada
router.get('/mi-equipo', async (req, res) => {
  try {
    let coronas = [];
    try {
      const coronasRes = await pool.query('SELECT * FROM coronas ORDER BY orden ASC');
      coronas = coronasRes.rows;
    } catch { /* tabla coronas no existe aún */ }

    const { rows: clientas } = await pool.query(
      `SELECT c.id, c.nombre_completo, c.celular, c.monto_acumulado, c.visitas_totales, c.fecha_registro,
              (SELECT COUNT(*) FROM notificaciones_descuento nd
               JOIN descuentos d ON nd.descuento_id = d.id
               WHERE nd.cliente_id = c.id AND d.activo = true) AS descuentos_activos
       FROM clientes c
       WHERE c.creado_por = $1
       ORDER BY c.monto_acumulado DESC`,
      [req.user.id]
    );

    const clientasConCorona = clientas.map((c, idx) => {
      const monto = parseFloat(c.monto_acumulado);
      let corona = null;
      for (let i = coronas.length - 1; i >= 0; i--) {
        if (monto >= parseFloat(coronas[i].monto_minimo)) {
          corona = coronas[i];
          break;
        }
      }
      return { ...c, posicion: idx + 1, corona };
    });

    res.json({ clientas: clientasConCorona, coronas });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/ranking/coronas — Catálogo de coronas
router.get('/coronas', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM coronas ORDER BY orden ASC');
    res.json({ coronas: rows });
  } catch (err) {
    res.json({ coronas: [] });
  }
});

// GET /api/ranking/alertas — Alertas pendientes de la promotora
router.get('/alertas', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT ad.*, c.nombre_completo AS cliente_nombre, c.celular AS cliente_celular,
              c.monto_acumulado, d.nombre AS descuento_nombre, d.porcentaje, d.monto_minimo_requerido
       FROM alertas_descuento ad
       JOIN clientes c ON ad.cliente_id = c.id
       JOIN descuentos d ON ad.descuento_id = d.id
       WHERE ad.promotora_id = $1 AND ad.enviada = false
       ORDER BY ad.monto_faltante ASC`,
      [req.user.id]
    );
    res.json({ alertas: rows });
  } catch (err) {
    // Si la tabla alertas_descuento no existe, retornar vacío
    res.json({ alertas: [] });
  }
});

// GET /api/ranking/proximas-alertas — Clientas que están cerca de alcanzar un descuento
router.get('/proximas-alertas', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.id, c.nombre_completo, c.celular, c.monto_acumulado,
              d.id AS descuento_id, d.nombre AS descuento_nombre, d.porcentaje,
              d.monto_minimo_requerido, d.alerta_distancia,
              (d.monto_minimo_requerido - c.monto_acumulado) AS monto_faltante
       FROM clientes c
       CROSS JOIN descuentos d
       WHERE d.activo = true
         AND d.alertas_activas = true
         AND d.alerta_distancia > 0
         AND c.monto_acumulado < d.monto_minimo_requerido
         AND (d.monto_minimo_requerido - c.monto_acumulado) <= d.alerta_distancia
         AND c.celular IS NOT NULL AND c.celular != ''
         AND NOT EXISTS (
           SELECT 1 FROM alertas_descuento ad
           WHERE ad.cliente_id = c.id AND ad.descuento_id = d.id AND ad.enviada = false
         )
       ORDER BY monto_faltante ASC
       LIMIT 20`
    );
    res.json({ proximas: rows });
  } catch (err) {
    res.json({ proximas: [] });
  }
});

// POST /api/ranking/alertas/crear — Crear alerta para una clienta específica
router.post('/alertas/crear', async (req, res) => {
  const { cliente_id, descuento_id } = req.body;
  if (!cliente_id || !descuento_id) {
    return res.status(400).json({ error: 'Se requiere cliente_id y descuento_id' });
  }

  try {
    const { rows: cliente } = await pool.query('SELECT * FROM clientes WHERE id = $1', [cliente_id]);
    if (!cliente.length) return res.status(404).json({ error: 'Cliente no encontrado' });

    const { rows: descuento } = await pool.query('SELECT * FROM descuentos WHERE id = $1', [descuento_id]);
    if (!descuento.length) return res.status(404).json({ error: 'Descuento no encontrado' });

    const montoFaltante = parseFloat(descuento[0].monto_minimo_requerido) - parseFloat(cliente[0].monto_acumulado);
    if (montoFaltante <= 0) return res.status(400).json({ error: 'La clienta ya alcanzó este descuento' });

    const { rows: existe } = await pool.query(
      'SELECT id FROM alertas_descuento WHERE cliente_id = $1 AND descuento_id = $2 AND enviada = false',
      [cliente_id, descuento_id]
    );
    if (existe.length) return res.status(400).json({ error: 'Ya existe una alerta pendiente para esta clienta y descuento' });

    const { rows } = await pool.query(
      `INSERT INTO alertas_descuento (cliente_id, descuento_id, promotora_id, monto_faltante, porcentaje_descuento, nombre_descuento)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [cliente_id, descuento_id, req.user.id, montoFaltante, descuento[0].porcentaje, descuento[0].nombre]
    );

    res.status(201).json({ alerta: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/ranking/alertas/:id/enviar — Marcar alerta como enviada
router.post('/alertas/:id/enviar', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE alertas_descuento SET enviada = true, fecha_enviada = NOW()
       WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Alerta no encontrada' });
    res.json({ alerta: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/ranking/alertas/crear-automaticas — Crear alertas para clientas cercanas (llamado desde clientes.js)
router.post('/alertas/crear-automaticas', async (req, res) => {
  const { cliente_id } = req.body;
  if (!cliente_id) return res.status(400).json({ error: 'Se requiere cliente_id' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: cliente } = await client.query('SELECT * FROM clientes WHERE id = $1', [cliente_id]);
    if (!cliente.length) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Cliente no encontrado' }); }

    const c = cliente[0];
    const { rows: descuentos } = await client.query(
      'SELECT * FROM descuentos WHERE activo = true AND alertas_activas = true AND alerta_distancia > 0'
    );

    const nuevas = [];
    for (const d of descuentos) {
      const montoFaltante = parseFloat(d.monto_minimo_requerido) - parseFloat(c.monto_acumulado);
      if (montoFaltante > 0 && montoFaltante <= parseFloat(d.alerta_distancia)) {
        const { rows: existe } = await client.query(
          'SELECT id FROM alertas_descuento WHERE cliente_id = $1 AND descuento_id = $2 AND enviada = false',
          [cliente_id, d.id]
        );
        if (!existe.length) {
          const { rows } = await client.query(
            `INSERT INTO alertas_descuento (cliente_id, descuento_id, promotora_id, monto_faltante, porcentaje_descuento, nombre_descuento)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [cliente_id, d.id, c.creado_por, montoFaltante, d.porcentaje, d.nombre]
          );
          nuevas.push(rows[0]);
        }
      }
    }

    await client.query('COMMIT');
    res.json({ alertas_creadas: nuevas });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  } finally {
    client.release();
  }
});

// DELETE /api/ranking/alertas/:id — Eliminar alerta pendiente
router.delete('/alertas/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'DELETE FROM alertas_descuento WHERE id = $1 AND enviada = false RETURNING id',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Alerta no encontrada o ya enviada' });
    res.json({ eliminado: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

export default router;
