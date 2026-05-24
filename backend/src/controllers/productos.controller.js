import { pool } from '../config/db.js';

// 📦 GET PRODUCTOS (Ahora mostrará TODO, tenga o no inventario)
export const getProductos = async (req, res) => {
  try {
    const pagina = parseInt(req.query.page) || 1;
    const limite = parseInt(req.query.limit) || 15;
    const offset = (pagina - 1) * limite;

    const { nombre, codigo, categoria } = req.query;

    let query = `
      SELECT 
        p.id,
        p.nombre,
        p.codigo,
        p.id_categoria,
        c.nombre AS categoria,
        p.precio_compra,
        p.precio_venta
      FROM productos p
      INNER JOIN categorias c ON p.id_categoria = c.id
      WHERE p.activo = 1
    `;

    const params = [];

    if (nombre && nombre.trim() !== '') {
      query += ` AND LOWER(p.nombre) LIKE ?`;
      params.push(`%${nombre.trim().toLowerCase()}%`);
    }

    if (codigo && codigo.trim() !== '') {
      query += ` AND LOWER(p.codigo) LIKE ?`;
      params.push(`%${codigo.trim().toLowerCase()}%`);
    }

    if (categoria && categoria !== '') {
      query += ` AND p.id_categoria = ?`;
      params.push(categoria);
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

export const createProducto = async (req, res) => {
  try {
    const { nombre, codigo, id_categoria, precio_compra, precio_venta } = req.body;

    if (!nombre || !codigo || !id_categoria || precio_compra == null || precio_venta == null) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    const trimmedNombre = nombre.trim();
    const trimmedCodigo = codigo.trim();

    const [existe] = await pool.query(
      'SELECT id FROM productos WHERE LOWER(codigo) = LOWER(?) LIMIT 1',
      [trimmedCodigo]
    );

    if (existe.length > 0) {
      return res.status(400).json({ error: 'El código ya existe' });
    }

    await pool.query(
      `INSERT INTO productos (nombre, codigo, id_categoria, precio_compra, precio_venta)
       VALUES (?, ?, ?, ?, ?)`,
      [trimmedNombre, trimmedCodigo, id_categoria, precio_compra, precio_venta]
    );

    res.json({ message: 'Producto creado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export const updateProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, codigo, id_categoria, precio_compra, precio_venta } = req.body;

    if (!nombre || !codigo || !id_categoria || precio_compra == null || precio_venta == null) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    const trimmedNombre = nombre.trim();
    const trimmedCodigo = codigo.trim();

    const [producto] = await pool.query(
      'SELECT id FROM productos WHERE id = ? AND activo = 1 LIMIT 1',
      [id]
    );

    if (producto.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const [existe] = await pool.query(
      'SELECT id FROM productos WHERE LOWER(codigo) = LOWER(?) AND id != ? LIMIT 1',
      [trimmedCodigo, id]
    );

    if (existe.length > 0) {
      return res.status(400).json({ error: 'El código ya existe en otro producto' });
    }

    await pool.query(
      `UPDATE productos
       SET nombre = ?, codigo = ?, id_categoria = ?, precio_compra = ?, precio_venta = ?
       WHERE id = ?`,
      [trimmedNombre, trimmedCodigo, id_categoria, precio_compra, precio_venta, id]
    );

    res.json({ message: 'Producto actualizado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteProducto = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      `UPDATE productos
       SET activo = 0
       WHERE id = ? AND activo = 1`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json({ message: 'Producto eliminado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

