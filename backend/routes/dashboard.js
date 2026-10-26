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

// ── Ventas: KPIs del periodo actual ─────────────────────────────
// GET /api/dashboard/ventas-resumen — totales de hoy / semana / mes / año
// Se usa LOCALTIMESTAMP (hora local de la BD) para que las comparaciones
// coincidan con cómo se guardan las fechas en historial_ingresos.
router.get('/ventas-resumen', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         COALESCE(SUM(monto) FILTER (WHERE fecha >= date_trunc('day', LOCALTIMESTAMP)), 0) AS hoy,
         COALESCE(SUM(monto) FILTER (WHERE fecha >= date_trunc('day', LOCALTIMESTAMP) - INTERVAL '1 day'
                                      AND fecha < date_trunc('day', LOCALTIMESTAMP)), 0) AS ayer,
         COALESCE(SUM(monto) FILTER (WHERE fecha >= date_trunc('day', LOCALTIMESTAMP) - INTERVAL '6 days'), 0) AS semana,
         COALESCE(SUM(monto) FILTER (WHERE fecha >= date_trunc('month', LOCALTIMESTAMP)), 0) AS mes,
         COALESCE(SUM(monto) FILTER (WHERE fecha >= date_trunc('month', LOCALTIMESTAMP) - INTERVAL '1 month'
                                      AND fecha < date_trunc('month', LOCALTIMESTAMP)), 0) AS mes_anterior,
         COALESCE(SUM(monto) FILTER (WHERE fecha >= date_trunc('year', LOCALTIMESTAMP)), 0) AS anio,
         COUNT(*) FILTER (WHERE fecha >= date_trunc('day', LOCALTIMESTAMP)) AS compras_hoy,
         COUNT(*) FILTER (WHERE fecha >= date_trunc('month', LOCALTIMESTAMP)) AS compras_mes,
         COUNT(*) FILTER (WHERE fecha >= date_trunc('year', LOCALTIMESTAMP)) AS compras_anio,
         COUNT(DISTINCT cliente_id) FILTER (WHERE fecha >= date_trunc('month', LOCALTIMESTAMP)) AS clientas_mes
       FROM historial_ingresos`
    );

    const r = rows[0];
    const n = v => parseFloat(v) || 0;
    const i = v => parseInt(v) || 0;
    const mes = n(r.mes);
    const mesAnterior = n(r.mes_anterior);
    const comprasMes = i(r.compras_mes);

    res.json({
      hoy: n(r.hoy),
      ayer: n(r.ayer),
      semana: n(r.semana),
      mes,
      mes_anterior: mesAnterior,
      anio: n(r.anio),
      compras_hoy: i(r.compras_hoy),
      compras_mes: comprasMes,
      compras_anio: i(r.compras_anio),
      clientas_mes: i(r.clientas_mes),
      ticket_promedio: comprasMes > 0 ? mes / comprasMes : 0,
      variacion_mes: mesAnterior > 0 ? ((mes - mesAnterior) / mesAnterior) * 100 : null
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ── Ventas: historial por periodo (diario / mensual / anual) ────
// GET /api/dashboard/ventas?periodo=dia|mes|anio
// generate_series rellena los periodos sin ventas (total = 0) para que el
// carrusel y la gráfica muestren la línea completa. Orden: más reciente primero.
router.get('/ventas', async (req, res) => {
  const periodo = ['dia', 'mes', 'anio'].includes(req.query.periodo) ? req.query.periodo : 'mes';

  const SERIES = {
    dia: {
      sql: `SELECT to_char(d, 'DD Mon') AS label,
                   to_char(d, 'YYYY-MM-DD') AS key,
                   COUNT(h.id) AS compras,
                   COUNT(DISTINCT h.cliente_id) AS clientas,
                   COALESCE(SUM(h.monto), 0) AS total
            FROM generate_series(date_trunc('day', LOCALTIMESTAMP) - INTERVAL '59 days',
                                 date_trunc('day', LOCALTIMESTAMP), INTERVAL '1 day') AS d
            LEFT JOIN historial_ingresos h ON h.fecha >= d AND h.fecha < d + INTERVAL '1 day'
            GROUP BY d
            ORDER BY d DESC`,
      unidad: 'día'
    },
    mes: {
      sql: `SELECT to_char(d, 'Mon YY') AS label,
                   to_char(d, 'YYYY-MM') AS key,
                   COUNT(h.id) AS compras,
                   COUNT(DISTINCT h.cliente_id) AS clientas,
                   COALESCE(SUM(h.monto), 0) AS total
            FROM generate_series(date_trunc('month', LOCALTIMESTAMP) - INTERVAL '11 months',
                                 date_trunc('month', LOCALTIMESTAMP), INTERVAL '1 month') AS d
            LEFT JOIN historial_ingresos h ON h.fecha >= d AND h.fecha < d + INTERVAL '1 month'
            GROUP BY d
            ORDER BY d DESC`,
      unidad: 'mes'
    },
    anio: {
      sql: `SELECT to_char(d, 'YYYY') AS label,
                   to_char(d, 'YYYY') AS key,
                   COUNT(h.id) AS compras,
                   COUNT(DISTINCT h.cliente_id) AS clientas,
                   COALESCE(SUM(h.monto), 0) AS total
            FROM generate_series(
                   date_trunc('year', COALESCE((SELECT MIN(fecha) FROM historial_ingresos), LOCALTIMESTAMP)),
                   date_trunc('year', LOCALTIMESTAMP), INTERVAL '1 year') AS d
            LEFT JOIN historial_ingresos h ON h.fecha >= d AND h.fecha < d + INTERVAL '1 year'
            GROUP BY d
            ORDER BY d DESC`,
      unidad: 'año'
    }
  };

  try {
    const { rows } = await pool.query(SERIES[periodo].sql);
    res.json({ periodo, unidad: SERIES[periodo].unidad, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ── Ventas: clientas que más compran ────────────────────────────
// GET /api/dashboard/top-clientes?limit=10 — ranking por monto total (desc)
router.get('/top-clientes', async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);
  try {
    const { rows } = await pool.query(
      `SELECT c.id, c.nombre_completo, c.departamento, c.provincia,
              COALESCE(SUM(h.monto), 0) AS total,
              COUNT(h.id) AS compras,
              MAX(h.fecha) AS ultima_compra
       FROM historial_ingresos h
       JOIN clientes c ON c.id = h.cliente_id
       GROUP BY c.id, c.nombre_completo, c.departamento, c.provincia
       ORDER BY total DESC, compras DESC
       LIMIT $1`,
      [limit]
    );
    res.json({ data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

export default router;
