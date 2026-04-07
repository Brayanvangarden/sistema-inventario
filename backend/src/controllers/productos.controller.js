import { pool } from '../config/db.js';


// 📦 GET PRODUCTOS (Ahora mostrará TODO, tenga o no inventario)
export const getProductos = async (req, res) => {
    try {
        // Parámetros de paginación
        const pagina = parseInt(req.query.page) || 1;
        const limite = parseInt(req.query.limit) || 15;
        const offset = (pagina - 1) * limite;

        // Parámetro de búsqueda
        const { buscar } = req.query;

        // Construcción dinámica de la consulta
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

        if (buscar && buscar.trim() !== '') {
            query += ` AND LOWER(p.nombre) LIKE ?`;
            params.push(`%${buscar.toLowerCase()}%`);
        }

        query += ` ORDER BY p.id DESC LIMIT ? OFFSET ?`;
        params.push(limite, offset);

        const [rows] = await pool.query(query, params);

        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ➕ CREAR PRODUCTO
export const createProducto = async (req, res) => {
    try {
        const { nombre, codigo, id_categoria, precio_compra, precio_venta } = req.body;

        // 🔍 VALIDACIÓN
        if (!nombre || !codigo || !id_categoria || !precio_compra || !precio_venta) {
            return res.status(400).json({ error: "Todos los campos son obligatorios" });
        }

        // 🔍 VALIDAR DUPLICADO
        const [existe] = await pool.query(
            "SELECT id FROM productos WHERE codigo = ?",
            [codigo]
        );

        if (existe.length > 0) {
            return res.status(400).json({ error: "El código ya existe" });
        }

        await pool.query(`
            INSERT INTO productos (nombre, codigo, id_categoria, precio_compra, precio_venta)
            VALUES (?, ?, ?, ?, ?)
        `, [nombre, codigo, id_categoria, precio_compra, precio_venta]);

        res.json({ message: "Producto creado correctamente" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};



// ✏️ ACTUALIZAR PRODUCTO
export const updateProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, codigo, id_categoria, precio_compra, precio_venta } = req.body;

        // 🔍 VALIDACIÓN
        if (!nombre || !codigo || !id_categoria || !precio_compra || !precio_venta) {
            return res.status(400).json({ error: "Todos los campos son obligatorios" });
        }

        // 🔍 VERIFICAR SI EXISTE
        const [producto] = await pool.query(
            "SELECT id FROM productos WHERE id = ? AND activo = 1",
            [id]
        );

        if (producto.length === 0) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }

        // 🔍 VALIDAR DUPLICADO (EXCLUYENDO EL MISMO ID)
        const [existe] = await pool.query(
            "SELECT id FROM productos WHERE codigo = ? AND id != ?",
            [codigo, id]
        );

        if (existe.length > 0) {
            return res.status(400).json({ error: "El código ya existe en otro producto" });
        }

        // 🔄 ACTUALIZAR
        await pool.query(`
            UPDATE productos 
            SET nombre=?, codigo=?, id_categoria=?, precio_compra=?, precio_venta=?
            WHERE id=?
        `, [nombre, codigo, id_categoria, precio_compra, precio_venta, id]);

        res.json({ message: "Producto actualizado correctamente" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};



// 🗑️ ELIMINAR (SOFT DELETE)
export const deleteProducto = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await pool.query(`
            UPDATE productos 
            SET activo = 0 
            WHERE id=? AND activo = 1
        `, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }

        res.json({ message: "Producto eliminado correctamente" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

