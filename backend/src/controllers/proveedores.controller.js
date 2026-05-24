import { pool } from '../config/db.js';

export const getProveedores = async (req, res) => {
  try {
    const pagina = parseInt(req.query.page) || 1;
    const limite = parseInt(req.query.limit) || 15;
    const offset = (pagina - 1) * limite;
    const { empresa } = req.query;

    let query = `
      SELECT 
        p.id,
        p.empresa,
        i.nombre,
        i.correo,
        i.telefono,
        i.direccion,
        p.id_persona
      FROM proveedores p
      INNER JOIN persona i ON p.id_persona = i.id
      WHERE p.activo = 1
    `;

    const params = [];

    if (empresa && empresa.trim() !== '') {
      query += ` AND LOWER(p.empresa) LIKE ?`;
      params.push(`%${empresa.trim().toLowerCase()}%`);
    }

    query += ` ORDER BY p.id DESC LIMIT ? OFFSET ?`;
    params.push(limite, offset);

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export const createProveedor = async (req, res) => {
  try {
    const { id_persona, empresa } = req.body;

    if (!id_persona || !empresa || !empresa.trim()) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    const trimmedEmpresa = empresa.trim();

    const [existing] = await pool.query(
      'SELECT id FROM proveedores WHERE LOWER(empresa) = LOWER(?) LIMIT 1',
      [trimmedEmpresa]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'El proveedor ya existe' });
    }

    const [persona] = await pool.query(
      'SELECT id FROM persona WHERE id = ? AND activo = 1 LIMIT 1',
      [id_persona]
    );

    if (persona.length === 0) {
      return res.status(400).json({ error: 'La persona asociada no existe' });
    }

    await pool.query(
      'INSERT INTO proveedores (empresa, id_persona) VALUES (?, ?)',
      [trimmedEmpresa, id_persona]
    );

    res.json({ message: 'Proveedor creado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export const updateProveedor = async (req, res) => {
  try {
    const { id } = req.params;
    const { empresa, id_persona } = req.body;

    if (!empresa || !id_persona || !empresa.trim()) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    const [proveedor] = await pool.query(
      'SELECT id FROM proveedores WHERE id = ? AND activo = 1 LIMIT 1',
      [id]
    );

    if (proveedor.length === 0) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    const [existing] = await pool.query(
      'SELECT id FROM proveedores WHERE LOWER(empresa) = LOWER(?) AND id != ? LIMIT 1',
      [empresa.trim(), id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'El proveedor ya existe.' });
    }

    const [persona] = await pool.query(
      'SELECT id FROM persona WHERE id = ? AND activo = 1 LIMIT 1',
      [id_persona]
    );

    if (persona.length === 0) {
      return res.status(400).json({ error: 'La persona asociada no existe' });
    }

    await pool.query(
      'UPDATE proveedores SET empresa = ?, id_persona = ? WHERE id = ?',
      [empresa.trim(), id_persona, id]
    );

    res.json({ message: 'Proveedor actualizado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteProveedor = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      'UPDATE proveedores SET activo = 0 WHERE id = ? AND activo = 1',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    res.json({ message: 'Proveedor eliminado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

