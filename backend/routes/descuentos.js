import express from 'express';
import pool from '../db/pool.js';
import { authMiddleware, requireRol } from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);

// GET /api/descuentos
router.get('/', async (req, res) => {
  await pool.query(`UPDATE descuentos SET activo = false WHERE activo = true AND fecha_expiracion IS NOT NULL AND fecha_expiracion < NOW()`);
  try {
    const { rows } = await pool.query(`SELECT * FROM descuentos ORDER BY fecha_creacion DESC`);
    res.json({ descuentos: rows });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/descuentos — solo admin
router.post('/', requireRol('admin'), async (req, res) => {
  const { nombre, porcentaje, monto_minimo_requerido, vigencia_valor, vigencia_unidad, duracion_activo_valor, duracion_activo_unidad } = req.body;

  if (!nombre || !porcentaje || !monto_minimo_requerido || !vigencia_valor || !vigencia_unidad || !duracion_activo_valor || !duracion_activo_unidad)
    return res.status(400).json({ error: 'Todos los campos son requeridos' });

  try {
    const { rows } = await pool.query(
      `INSERT INTO descuentos (nombre, porcentaje, monto_minimo_requerido, vigencia_valor, vigencia_unidad, duracion_activo_valor, duracion_activo_unidad)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [nombre, porcentaje, monto_minimo_requerido, vigencia_valor, vigencia_unidad, duracion_activo_valor, duracion_activo_unidad]
    );
    res.status(201).json({ descuento: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// PUT /api/descuentos/:id — solo admin
router.put('/:id', requireRol('admin'), async (req, res) => {
  const { nombre, porcentaje, monto_minimo_requerido, vigencia_valor, vigencia_unidad, duracion_activo_valor, duracion_activo_unidad, activo } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE descuentos SET
        nombre = COALESCE($1, nombre),
        porcentaje = COALESCE($2, porcentaje),
        monto_minimo_requerido = COALESCE($3, monto_minimo_requerido),
        vigencia_valor = COALESCE($4, vigencia_valor),
        vigencia_unidad = COALESCE($5, vigencia_unidad),
        duracion_activo_valor = COALESCE($6, duracion_activo_valor),
        duracion_activo_unidad = COALESCE($7, duracion_activo_unidad),
        activo = COALESCE($8, activo)
       WHERE id = $9 RETURNING *`,
      [nombre, porcentaje, monto_minimo_requerido, vigencia_valor, vigencia_unidad, duracion_activo_valor, duracion_activo_unidad, activo, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'No encontrado' });
    res.json({ descuento: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// DELETE /api/descuentos/:id — solo admin
router.delete('/:id', requireRol('admin'), async (req, res) => {
  try {
    await pool.query(`DELETE FROM descuentos WHERE id = $1`, [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

export default router;
