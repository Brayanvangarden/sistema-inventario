import { pool } from '../config/db.js';
import bcrypt from 'bcrypt';


// 📦 GET usuario
export const getUsuarios = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                u.id,
                u.id_persona,
                u.usuario,
                CONCAT(p.nombre, ' ', p.apellido) AS persona,
                p.correo,
                r.nombre AS rol,
                u.id_rol
            FROM usuarios u
            INNER JOIN persona p ON u.id_persona = p.id
            LEFT JOIN roles r ON u.id_rol = r.id
            WHERE u.activo = 1
            ORDER BY u.id DESC
        `);

        res.json(rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// ➕ CREAR USUARIO
export const createUsuario = async (req, res) => {
    try {
        const { id_persona, usuario, contrasena, id_rol } = req.body;

        // 🔍 VALIDACIÓN
        if (!id_persona || !usuario || !contrasena || !id_rol) {
            return res.status(400).json({ error: "Todos los campos son obligatorios" });
        }

        // 🔍 VALIDAR PERSONA
        const [persona] = await pool.query(
            "SELECT id FROM persona WHERE id = ?",
            [id_persona]
        );

        if (persona.length === 0) {
            return res.status(404).json({ error: "Persona no encontrada" });
        }

        // 🔍 VALIDAR USUARIO DUPLICADO
        const [existeUser] = await pool.query(
            "SELECT id FROM usuarios WHERE usuario = ?",
            [usuario]
        );

        if (existeUser.length > 0) {
            return res.status(400).json({ error: "El usuario ya existe" });
        }

        // 🔍 VALIDAR PERSONA YA ASIGNADA
        const [existePersona] = await pool.query(
            "SELECT id FROM usuarios WHERE id_persona = ?",
            [id_persona]
        );

        if (existePersona.length > 0) {
            return res.status(400).json({ error: "La persona ya tiene usuario" });
        }

        // 🔐 HASH PASSWORD
        const hash = await bcrypt.hash(contrasena, 10);

        // ➕ INSERT
        await pool.query(`
            INSERT INTO usuarios (id_persona, usuario, contrasena, id_rol)
            VALUES (?, ?, ?, ?)
        `, [id_persona, usuario, hash, id_rol]);

        res.json({ message: "Usuario creado correctamente 🔐" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// ✏️ ACTUALIZAR USUARIO
export const updateUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const { id_persona, usuario, contrasena, id_rol } = req.body;

        if (!usuario || !id_rol || !id_persona) {
            return res.status(400).json({ error: "Persona, usuario y rol son obligatorios" });
        }

        const [user] = await pool.query(
            "SELECT * FROM usuarios WHERE id = ? AND activo = 1",
            [id]
        );

        if (user.length === 0) return res.status(404).json({ error: "Usuario no encontrado" });

        let hash = user[0].contrasena;
        if (contrasena) {
            hash = await bcrypt.hash(contrasena, 10);
        }

        // 🔄 EL ORDEN DEBE COINCIDIR EXACTAMENTE CON LOS "?" DEL SET
        // 1. id_persona, 2. usuario, 3. contrasena (hash), 4. id_rol, 5. id (el WHERE)
        await pool.query(`
            UPDATE usuarios 
            SET id_persona = ?, usuario = ?, contrasena = ?, id_rol = ?
            WHERE id = ?
        `, [id_persona, usuario, hash, id_rol, id]); 

        res.json({ message: "Usuario actualizado correctamente ✏️" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};


// 🗑️ ELIMINAR USUARIO (SOFT DELETE)
export const deleteUsuario = async (req, res) => {
    try {
        const { id } = req.params;

        // 🔍 VERIFICAR SI EXISTE
        const [user] = await pool.query(
            "SELECT id FROM usuarios WHERE id = ? AND activo = 1",
            [id]
        );

        if (user.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        // 🔄 SOFT DELETE
        await pool.query(`
            UPDATE usuarios 
            SET activo = 0 
            WHERE id = ?
        `, [id]);

        res.json({ message: "Usuario eliminado correctamente 🗑️" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};