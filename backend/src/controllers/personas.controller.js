import { pool } from '../config/db.js';

// 📦 GET PERSONAS
export const getPersonas = async (req, res) => {
  try {
    const { buscar } = req.query;
    const pagina = parseInt(req.query.page)  || 1;
    const limite = parseInt(req.query.limit) || 10;
    const offset = (pagina - 1) * limite;

    let query = `
      SELECT p.id, p.nombre, p.apellido, p.telefono, p.correo, p.direccion, p.cedula
      FROM persona p
      WHERE p.activo = 1
    `;

    const params = [];

    if (buscar && buscar.trim() !== "") {
      query += `
        AND (LOWER(p.nombre) LIKE ? OR LOWER(p.apellido) LIKE ? OR LOWER(p.cedula) LIKE ?)
      `;
      const filtro = `%${buscar.toLowerCase()}%`;
      params.push(filtro, filtro, filtro);
    }

    query += ` ORDER BY p.nombre ASC LIMIT ? OFFSET ?`;
    params.push(limite, offset);

    const [rows] = await pool.query(query, params);
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
        const [existeCorreo] = await pool.query(
            "SELECT id FROM persona WHERE correo = ? LIMIT 1",
            [correo]
        );

        if (existeCorreo.length > 0) {
            return res.status(400).json({ error: "El correo ya está registrado" });
        }

        const [existeCedula] = await pool.query(
            "SELECT id FROM persona WHERE cedula = ? LIMIT 1",
            [cedula]
        );

        if (existeCedula.length > 0) {
            return res.status(400).json({ error: "La cédula ya está registrada" });
        }

        await pool.query(`
            INSERT INTO persona (nombre, apellido, telefono, correo, direccion, cedula)
            VALUES (?, ?, ?, ?, ?, ?)
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
            "SELECT id FROM persona WHERE id = ? AND activo = 1 LIMIT 1",
            [id]
        );

        if (persona.length === 0) {
            return res.status(404).json({ error: "Persona no encontrada" });
        }

        const [existeCorreo] = await pool.query(
            "SELECT id FROM persona WHERE correo = ? AND id != ? LIMIT 1",
            [correo, id]
        );

        if (existeCorreo.length > 0) {
            return res.status(400).json({ error: "El correo ya está en uso" });
        }

        const [existeCedula] = await pool.query(
            "SELECT id FROM persona WHERE cedula = ? AND id != ? LIMIT 1",
            [cedula, id]
        );

        if (existeCedula.length > 0) {
            return res.status(400).json({ error: "La cédula ya está en uso" });
        }

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

