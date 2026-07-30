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
router.get('/por-promotora', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.nombre,
              COUNT(DISTINCT c.id) AS clientes_registrados,
              COALESCE(SUM(h.monto), 0) AS monto_total
       FROM usuarios u
       LEFT JOIN clientes c ON c.creado_por = u.id
       LEFT JOIN historial_ingresos h ON h.registrado_por = u.id
       WHERE u.rol IN ('promotora', 'promotora_lider')
       GROUP BY u.id, u.nombre
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
