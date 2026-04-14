import { pool } from '../config/db.js';

export const getProveedores = async (req, res) => {
  try {
    // 📌 Parámetros
    const pagina = parseInt(req.query.page) || 1;
    const limite = parseInt(req.query.limit) || 15;
    const offset = (pagina - 1) * limite;

    // 🔎 NUEVOS FILTROS
    const { empresa } = req.query;

    let query = `
      SELECT 
        p.id,
        p.empresa,
        p.id_persona
      FROM proveedores p
      INNER JOIN persona i ON p.id_persona = i.id
      WHERE p.activo = 1
    `;

    const params = [];

    // 🔎 FILTRO POR empresa
    if (empresa && empresa.trim() !== "") {
      query += ` AND LOWER(p.empresa) LIKE ?`;
      params.push(`%${empresa.toLowerCase()}%`);
    }

    // 📊 ORDEN + PAGINACIÓN
    query += ` ORDER BY p.id DESC LIMIT ? OFFSET ?`;
    params.push(limite, offset);

    const [rows] = await pool.query(query, params);

    res.json(rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// ➕ CREAR Proveedor
export const createProveedor = async (req, res) => {
    try {
        const { id_persona, empresa} = req.body;

        // 🔍 VALIDACIÓN
        if (!id_persona || !empresa) {
            return res.status(400).json({ error: "Todos los campos son obligatorios" });
        }

        // 🔍 VALIDAR DUPLICADO
        const [existe] = await pool.query(
            "SELECT id FROM proveedores WHERE empresa = ?",
            [empresa]
        );

        if (existe.length > 0) {
            return res.status(400).json({ error: "El proveedor ya existe" });
        }

        await pool.query(`
            INSERT INTO proveedores (empresa, id_persona)
            VALUES (?, ?)
        `, [empresa, id_persona]);

        res.json({ message: "Proveedor creado correctamente" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};



// ✏️ ACTUALIZAR Proveedor
export const updateProveedor = async (req, res) => {
    try {
        const { id } = req.params;
        const { empresa, id_persona } = req.body;

        // 🔍 VALIDACIÓN
        if (!empresa || !id_persona) {
            return res.status(400).json({ error: "Todos los campos son obligatorios" });
        }

        // 🔍 VERIFICAR SI EXISTE
        const [proveedor] = await pool.query(
            "SELECT id FROM proveedores WHERE id = ? AND activo = 1",
            [id]
        );

        if (proveedor.length === 0) {
            return res.status(404).json({ error: "Proveedor no encontrado" });
        }

        // 🔍 VALIDAR DUPLICADO
        const [existe] = await pool.query(
            "SELECT id FROM proveedores WHERE empresa = ? AND id != ?",
            [empresa, id]
        );

        if (existe.length > 0) {
            return res.status(400).json({ error: "El proveedor ya existe." });
        }

        // 🔄 ACTUALIZAR
        await pool.query(`
            UPDATE proveedores 
            SET empresa=?, id_persona=?
            WHERE id=?
        `, [empresa, id_persona, id]);

        res.json({ message: "Proveedor actualizado correctamente" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// 🗑️ ELIMINAR (SOFT DELETE)
export const deleteProveedor = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await pool.query(`
            UPDATE proveedores 
            SET activo = 0 
            WHERE id=? AND activo = 1
        `, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Proveedor no encontrado" });
        }

        res.json({ message: "Proveedor eliminado correctamente" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

