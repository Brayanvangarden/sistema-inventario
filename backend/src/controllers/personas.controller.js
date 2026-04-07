import { pool } from '../config/db.js';

// 📦 GET PERSONAS
export const getPersonas = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                p.id,
                p.nombre,
                p.apellido,
                p.telefono,
                p.correo,
                p.direccion,
                p.cedula
            FROM persona p
            WHERE p.activo = 1
            ORDER BY p.id DESC
        `);

        res.json(rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// ➕ CREAR Persona
export const createPersona = async (req, res) => {
    try {
        const { nombre, apellido, telefono, correo, direccion, cedula } = req.body;

        // 🔍 VALIDACIÓN
        if (!nombre || !apellido || !telefono || !correo || !direccion || !cedula) {
            return res.status(400).json({ error: "Todos los campos son obligatorios" });
        }

        // 🔍 VALIDAR DUPLICADO POR CORREO
        const [existe] = await pool.query(
            "SELECT id FROM persona WHERE correo = ?",
            [correo]
        );

        if (existe.length > 0) {
            return res.status(400).json({ error: "El correo ya está registrado" });
        }

        // ➕ INSERT
        await pool.query(`
            INSERT INTO persona (nombre, apellido, telefono, correo, direccion, cedula)
            VALUES (?, ?, ?, ?, ?,?)
        `, [nombre, apellido, telefono, correo, direccion, cedula]);

        res.json({ message: "Persona creada correctamente" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// ✏️ ACTUALIZAR Persona
export const updatePersona = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, apellido, telefono, correo, direccion, cedula } = req.body;

        // 🔍 VALIDACIÓN
        if (!nombre || !apellido || !telefono || !correo || !direccion || !cedula) {
            return res.status(400).json({ error: "Todos los campos son obligatorios" });
        }

        // 🔍 VERIFICAR QUE EXISTE
        const [persona] = await pool.query(
            "SELECT id FROM persona WHERE id = ? AND activo = 1",
            [id]
        );

        if (persona.length === 0) {
            return res.status(404).json({ error: "Persona no encontrada" });
        }

        // // 🔍 VALIDAR DUPLICADO DE CORREO (EXCLUYENDO EL MISMO ID)
        // const [existe] = await pool.query(
        //     "SELECT id FROM persona WHERE correo = ? AND id != ?",
        //     [correo, id]
        // );

        // if (existe.length > 0) {
        //     return res.status(400).json({ error: "El correo ya está en uso" });
        // }

        // 🔄 UPDATE
        await pool.query(`
            UPDATE persona 
            SET nombre=?, apellido=?, telefono=?, correo=?, direccion=?, cedula=?
            WHERE id=?
        `, [nombre, apellido, telefono, correo, direccion, cedula, id]);

        res.json({ message: "Persona actualizada correctamente" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// 🗑️ ELIMINAR (SOFT DELETE)
export const deletePersona = async (req, res) => {
    try {
        const { id } = req.params;

        // 🔍 VERIFICAR QUE EXISTE
        const [persona] = await pool.query(
            "SELECT id FROM persona WHERE id = ? AND activo = 1",
            [id]
        );

        if (persona.length === 0) {
            return res.status(404).json({ error: "Persona no encontrada" });
        }

        // 🗑️ SOFT DELETE
        await pool.query(`
            UPDATE persona 
            SET activo = 0 
            WHERE id=?
        `, [id]);

        res.json({ message: "Persona eliminada correctamente" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

