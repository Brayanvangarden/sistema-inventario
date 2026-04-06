import { pool } from '../config/db.js';

export const getCategorias = async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT id, nombre FROM categorias WHERE activo = 1"
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};