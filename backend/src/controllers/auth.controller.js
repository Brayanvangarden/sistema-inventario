import { pool } from '../config/db.js';

export const login = async (req, res) => {
    const { usuario, contrasena } = req.body;

    try {
        const [rows] = await pool.query(
            `SELECT u.id, u.usuario, r.nombre AS rol
             FROM usuarios u
             JOIN roles r ON u.id_rol = r.id
             WHERE u.usuario = ? AND u.contrasena = ?`,
            [usuario, contrasena]
        );

        if (rows.length === 0) {
            return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos' });
        }

        res.json(rows[0]);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};