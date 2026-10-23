import express from 'express';
import pool from '../db/pool.js';
import { authMiddleware, requireRol } from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);
router.use(requireRol('admin'));

// GET /api/dashboard/resumen
router.get('/resumen', async (req, res) => {
  try {
    const [clientes, monto, mes, promotoras] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS total FROM clientes`),
      pool.query(`SELECT COALESCE(SUM(monto_acumulado), 0) AS total FROM clientes`),
      pool.query(`SELECT COALESCE(SUM(monto), 0) AS total FROM historial_ingresos WHERE fecha >= date_trunc('month', NOW())`),
      pool.query(`SELECT COUNT(*) AS total FROM usuarios WHERE rol IN ('promotora', 'promotora_lider') AND activo = true`),
    ]);

    res.json({
      total_clientes: parseInt(clientes.rows[0].total),
      monto_total_fidelizado: parseFloat(monto.rows[0].total),
      ingresos_del_mes: parseFloat(mes.rows[0].total),
      promotoras_activas: parseInt(promotoras.rows[0].total),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/dashboard/ingresos-tiempo?meses=6
router.get('/ingresos-tiempo', async (req, res) => {
  const meses = parseInt(req.query.meses) || 6;
  try {
    const { rows } = await pool.query(
      `SELECT to_char(date_trunc('month', fecha), 'Mon YY') AS mes,
              to_char(date_trunc('month', fecha), 'YYYY-MM') AS mes_key,
              SUM(monto) AS total
       FROM historial_ingresos
       WHERE fecha >= NOW() - ($1 || ' months')::INTERVAL
       GROUP BY 1, 2
       ORDER BY 2`,
      [meses]
    );
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/dashboard/por-promotora
// Los totales se calculan por separado (CTEs) y luego se unen: hacer un JOIN
// directo de clientes + historial_ingresos multiplicaba el monto por la
// cantidad de clientas de cada promotora (producto cartesiano).
router.get('/por-promotora', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `WITH registros AS (
         SELECT creado_por AS user_id, COUNT(*) AS total
         FROM clientes
         WHERE creado_por IS NOT NULL
         GROUP BY creado_por
       ),
       ventas AS (
         SELECT registrado_por AS user_id, COALESCE(SUM(monto), 0) AS total
         FROM historial_ingresos
         WHERE registrado_por IS NOT NULL
         GROUP BY registrado_por
       )
       SELECT u.nombre,
              COALESCE(r.total, 0) AS clientes_registrados,
              COALESCE(v.total, 0) AS monto_total
       FROM usuarios u
       LEFT JOIN registros r ON r.user_id = u.id
       LEFT JOIN ventas v ON v.user_id = u.id
       WHERE u.rol IN ('promotora', 'promotora_lider')
       ORDER BY monto_total DESC`
    );
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/dashboard/fidelizaciones-tiempo?meses=6
router.get('/fidelizaciones-tiempo', async (req, res) => {
  const meses = parseInt(req.query.meses) || 6;
  try {
    const { rows } = await pool.query(
      `SELECT to_char(date_trunc('month', fecha_registro), 'Mon YY') AS mes,
              to_char(date_trunc('month', fecha_registro), 'YYYY-MM') AS mes_key,
              COUNT(*) AS total
       FROM clientes
       WHERE fecha_registro >= NOW() - ($1 || ' months')::INTERVAL
       GROUP BY 1, 2
       ORDER BY 2`,
      [meses]
    );
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

export default router;
