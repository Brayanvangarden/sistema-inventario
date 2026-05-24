import { pool } from '../config/db.js';

export const getCategorias = async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT id, nombre FROM categorias WHERE activo = 1 ORDER BY nombre ASC"
        );
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

export const createCategoria = async (req, res) => {
    try {
        const { nombre } = req.body;

        if (!nombre || !nombre.trim()) {
            return res.status(400).json({ error: 'El nombre de la categoría es obligatorio' });
        }

        const [existing] = await pool.query(
            'SELECT id FROM categorias WHERE LOWER(nombre) = LOWER(?) LIMIT 1',
            [nombre.trim()]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'La categoría ya existe' });
        }

        await pool.query(
            'INSERT INTO categorias (nombre) VALUES (?)',
            [nombre.trim()]
        );

        res.json({ message: 'Categoría creada correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

export const updateCategoria = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre } = req.body;

        if (!nombre || !nombre.trim()) {
            return res.status(400).json({ error: 'El nombre de la categoría es obligatorio' });
        }

        const [categoria] = await pool.query(
            'SELECT id FROM categorias WHERE id = ? AND activo = 1 LIMIT 1',
            [id]
        );

        if (categoria.length === 0) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }

        const [existing] = await pool.query(
            'SELECT id FROM categorias WHERE LOWER(nombre) = LOWER(?) AND id != ? LIMIT 1',
            [nombre.trim(), id]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'Otra categoría con ese nombre ya existe' });
        }

        await pool.query(
            'UPDATE categorias SET nombre = ? WHERE id = ?',
            [nombre.trim(), id]
        );

        res.json({ message: 'Categoría actualizada correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

export const deleteCategoria = async (req, res) => {
    try {
        const { id } = req.params;

        const [categoria] = await pool.query(
            'SELECT id FROM categorias WHERE id = ? AND activo = 1 LIMIT 1',
            [id]
        );

        if (categoria.length === 0) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }

        await pool.query(
            'UPDATE categorias SET activo = 0 WHERE id = ?',
            [id]
        );

        res.json({ message: 'Categoría eliminada correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};