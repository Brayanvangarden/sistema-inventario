import { Router } from 'express';
import { pool } from '../config/db.js';

const router = Router();

// 📦 GET PRODUCTOS (con paginación)
router.get('/productos', async (req, res) => {
    try {
        const pagina = parseInt(req.query.page) || 1;
        const limite = parseInt(req.query.limit) || 15;
        const offset = (pagina - 1) * limite;

        const [rows] = await pool.query(`
            SELECT 
                p.id,
                p.nombre,
                p.codigo,
                p.id_categoria,
                c.nombre AS categoria,
                p.precio_compra,
                p.precio_venta
            FROM productos p
            LEFT JOIN categorias c ON p.id_categoria = c.id
            WHERE p.activo = 1
            ORDER BY p.id DESC
            LIMIT ? OFFSET ?
        `, [limite, offset]);

        res.json(rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// ➕ POST PRODUCTO
router.post('/productos', async (req, res) => {
    try {
        const { nombre, codigo, id_categoria, precio_compra, precio_venta } = req.body;

        if (!nombre || !codigo || !id_categoria || !precio_compra || !precio_venta) {
            return res.status(400).json({ error: "Todos los campos son obligatorios" });
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
});

// ✏️ UPDATE PRODUCTO
router.put('/productos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, codigo, id_categoria, precio_compra, precio_venta } = req.body;

        if (!nombre || !codigo || !id_categoria || !precio_compra || !precio_venta) {
            return res.status(400).json({ error: "Todos los campos son obligatorios" });
        }

        const [producto] = await pool.query(
            "SELECT id FROM productos WHERE id = ? AND activo = 1",
            [id]
        );

        if (producto.length === 0) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }

        const [existe] = await pool.query(
            "SELECT id FROM productos WHERE codigo = ? AND id != ?",
            [codigo, id]
        );

        if (existe.length > 0) {
            return res.status(400).json({ error: "El código ya existe" });
        }

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
});

// 🗑️ DELETE (SOFT DELETE)
router.delete('/productos/:id', async (req, res) => {
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
});

export default router;