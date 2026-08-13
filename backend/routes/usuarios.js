import express from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db/pool.js';
import { authMiddleware, requireRol } from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);

// GET /api/usuarios — admin ve todos; promotora_lider ve promotoras
router.get('/', requireRol('admin', 'promotora_lider'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, nombre, usuario, rol, activo, creado_en,
        (SELECT nombre FROM usuarios u2 WHERE u2.id = u.creado_por) AS creado_por_nombre
       FROM usuarios u ORDER BY creado_en DESC`
    );
    res.json({ usuarios: rows });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/usuarios — admin crea cualquier rol; promotora_lider solo promotora
router.post('/', requireRol('admin', 'promotora_lider'), async (req, res) => {
  const { nombre, usuario, password, rol } = req.body;

  if (!nombre || !usuario || !password || !rol)
    return res.status(400).json({ error: 'Todos los campos son requeridos' });

  // promotora_lider solo puede crear promotoras
  if (req.user.rol === 'promotora_lider' && rol !== 'promotora')
    return res.status(403).json({ error: 'Solo puedes crear promotoras' });

  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO usuarios (nombre, usuario, password_hash, rol, creado_por)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, nombre, usuario, rol, activo, creado_en`,
      [nombre, usuario, hash, rol, req.user.id]
    );
    res.status(201).json({ usuario: rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'El usuario ya existe' });
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// PATCH /api/usuarios/:id/toggle — admin activa/desactiva
router.patch('/:id/toggle', requireRol('admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE usuarios SET activo = NOT activo WHERE id = $1 RETURNING id, nombre, activo`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'No encontrado' });
    res.json({ usuario: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/usuarios/:id/actividad — cuántos clientes registró y sus ingresos
router.get('/:id/actividad', requireRol('admin'), async (req, res) => {
  try {
    const { rows: clientes } = await pool.query(
      `SELECT COUNT(*) AS total_clientes FROM clientes WHERE creado_por = $1`, [req.params.id]
    );
    const { rows: ingresos } = await pool.query(
      `SELECT COUNT(*) AS total_ingresos, SUM(monto) AS monto_total FROM historial_ingresos WHERE registrado_por = $1`, [req.params.id]
    );
    res.json({ ...clientes[0], ...ingresos[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/usuarios/:id/historial — timeline cronológico de actividad
router.get('/:id/historial', requireRol('admin'), async (req, res) => {
  const { limit = 50, offset = 0 } = req.query;
  try {
    const { rows: clientes } = await pool.query(
      `SELECT 
        'cliente_registrado' AS tipo,
        c.id AS referencia_id,
        c.nombre_completo AS detalle,
        c.monto_acumulado AS monto,
        c.fecha_registro AS fecha
       FROM clientes c
       WHERE c.creado_por = $1
       ORDER BY c.fecha_registro DESC`,
      [req.params.id]
    );

    const { rows: ingresos } = await pool.query(
      `SELECT 
        'ingreso_registrado' AS tipo,
        h.id AS referencia_id,
        c.nombre_completo AS cliente_nombre,
        c.id AS cliente_id,
        h.monto,
        h.nota,
        h.fecha
       FROM historial_ingresos h
       JOIN clientes c ON h.cliente_id = c.id
       WHERE h.registrado_por = $1
       ORDER BY h.fecha DESC`,
      [req.params.id]
    );

    const eventos = [...clientes.map(c => ({
      tipo: c.tipo,
      referencia_id: c.referencia_id,
      cliente: c.detalle,
      cliente_id: c.referencia_id,
      monto: c.monto,
      fecha: c.fecha,
      descripcion: `Registró a ${c.detalle}`
    })), ...ingresos.map(i => ({
      tipo: i.tipo,
      referencia_id: i.referencia_id,
      cliente: i.cliente_nombre,
      cliente_id: i.cliente_id,
      monto: i.monto,
      nota: i.nota,
      fecha: i.fecha,
      descripcion: `Registró ingreso de ${new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(i.monto || 0)} a ${i.cliente_nombre}`
    }))]
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
      .slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    res.json({ eventos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

export default router;
