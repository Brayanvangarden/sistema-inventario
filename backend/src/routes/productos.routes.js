import { Router } from 'express';
import { pool } from '../config/db.js';

const router = Router();

// 📦 GET PRODUCTOS (Ruta: /api/productos)
router.get('/productos', async (req, res) => {
    try {
        const pagina = parseInt(req.query.page) || 1;
        const limite = parseInt(req.query.limit) || 15;
        const offset = (pagina - 1) * limite;

        // Usamos LEFT JOIN para que salgan los 13 productos sí o sí
        const [rows] = await pool.query(`
            SELECT 
                p.id, p.nombre, p.codigo,
                c.nombre AS categoria,
                p.precio_venta
            FROM productos p
            LEFT JOIN categorias c ON p.id_categoria = c.id
            WHERE p.activo = 1
            LIMIT ? OFFSET ?
        `, [limite, offset]);

        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ➕ POST PRODUCTOS (Ruta: /api/productos)
router.post('/productos', async (req, res) => {
    try {
        const { nombre, codigo, id_categoria, precio_compra, precio_venta } = req.body;
        await pool.query(`
            INSERT INTO productos (nombre, codigo, id_categoria, precio_compra, precio_venta)
            VALUES (?, ?, ?, ?, ?)
        `, [nombre, codigo, id_categoria, precio_compra, precio_venta]);

        res.json({ message: "Producto creado" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
