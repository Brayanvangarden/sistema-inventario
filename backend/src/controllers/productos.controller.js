import { pool } from '../config/db.js';


// 📦 GET PRODUCTOS (Ahora mostrará TODO, tenga o no inventario)
router.get('/productos', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                p.id,
                p.nombre,
                p.codigo,
                c.nombre AS categoria,
                IFNULL(i.stock, 0) AS stock, -- Si no hay registro en inventario, muestra 0
                p.precio_venta
            FROM productos p
            INNER JOIN categorias c ON p.id_categoria = c.id
            WHERE p.activo = 1
            ORDER BY p.id DESC; -- Opcional: ver los más nuevos primero
        `);

        res.json(rows);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});




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

        const [result] = await pool.query(`
            UPDATE productos 
            SET nombre=?, codigo=?, id_categoria=?, precio_compra=?, precio_venta=?
            WHERE id=? AND activo = 1
        `, [nombre, codigo, id_categoria, precio_compra, precio_venta, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }

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