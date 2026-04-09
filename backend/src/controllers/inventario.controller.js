import { pool } from '../config/db.js';

// 📦 GET Inventario 
export const getInventario = async (req, res) => {
    const { termino, disponible } = req.query; // obtener parámetros de consulta

    // Iniciar la consulta base
    let query = `
    SELECT 
      i.id,
      i.id_producto,
      i.stock,
      p.nombre as producto,
      p.precio_venta,
      i.stock_minimo
    FROM inventario i
    INNER JOIN productos p ON i.id_producto = p.id
    WHERE i.activo = 1
  `;

    const params = [];

    // Agregar filtro por término si existe
    if (termino) {
        query += ' AND p.nombre LIKE ?';
        params.push(`%${termino}%`);
    }

    // Agregar filtro por disponibilidad si se solicita
    if (disponible === 'true') {
        query += ' AND i.stock > 0';
    }

    // Ordenar
    query += ' ORDER BY i.id DESC';

    try {
        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// ➕ CREAR INVENTARIO
export const createInventario = async (req, res) => {
    try {
        const { id_producto, stock, stock_minimo } = req.body;

        // 🔍 VALIDACIÓN
        if (!id_producto || stock == null || stock_minimo == null) {
            return res.status(400).json({ error: "Todos los campos son obligatorios" });
        }

        // VALIDAR NEGATIVOS 
        if (stock < 0 || stock_minimo < 0) {
            return res.status(400).json({ error: "Stock no puede ser negativo" });
        }

        // 🔍 VALIDAR QUE EL PRODUCTO EXISTE
        const [producto] = await pool.query(
            "SELECT id FROM productos WHERE id = ?",
            [id_producto]
        );

        if (producto.length === 0) {
            return res.status(404).json({ error: "Producto no existe" });
        }

        // 🔍 VALIDAR SI YA EXISTE INVENTARIO PARA ESE PRODUCTO
        const [existe] = await pool.query(
            "SELECT id FROM inventario WHERE id_producto = ? AND activo = 1",
            [id_producto]
        );

        if (existe.length > 0) {
            return res.status(400).json({ error: "El producto ya tiene inventario" });
        }

        // ➕ INSERT
        await pool.query(`
            INSERT INTO inventario (id_producto, stock, stock_minimo)
            VALUES (?, ?, ?)
        `, [id_producto, stock, stock_minimo]);

        res.json({ message: "Inventario creado correctamente" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// ✏️ ACTUALIZAR INVENTARIO
export const updateInventario = async (req, res) => {
    try {
        const { id } = req.params;
        const { id_producto, stock, stock_minimo } = req.body;

        // 🔍 1. VALIDAR CAMPOS
        if (!id_producto || stock == null || stock_minimo == null) {
            return res.status(400).json({ error: "Todos los campos son obligatorios" });
        }

        // 🔥 2. VALIDAR NEGATIVOS
        if (stock < 0 || stock_minimo < 0) {
            return res.status(400).json({ error: "Stock no puede ser negativo" });
        }

        // 🔍 3. VALIDAR QUE EXISTE INVENTARIO
        const [inventario] = await pool.query(
            "SELECT id FROM inventario WHERE id = ? AND activo = 1",
            [id]
        );

        if (inventario.length === 0) {
            return res.status(404).json({ error: "Inventario no encontrado" });
        }

        // 🔍 4. VALIDAR QUE EL PRODUCTO EXISTE
        const [producto] = await pool.query(
            "SELECT id FROM productos WHERE id = ?",
            [id_producto]
        );

        if (producto.length === 0) {
            return res.status(404).json({ error: "Producto no existe" });
        }

        // 🔍 5. VALIDAR DUPLICADO (OTRO INVENTARIO CON MISMO PRODUCTO)
        const [existe] = await pool.query(
            "SELECT id FROM inventario WHERE id_producto = ? AND id != ? AND activo = 1",
            [id_producto, id]
        );

        if (existe.length > 0) {
            return res.status(400).json({ error: "Ya existe inventario para este producto" });
        }

        // 🔄 6. UPDATE
        await pool.query(`
            UPDATE inventario 
            SET id_producto = ?, stock = ?, stock_minimo = ?
            WHERE id = ?
        `, [id_producto, stock, stock_minimo, id]);

        res.json({ message: "Inventario actualizado correctamente" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// 🗑️ ELIMINAR INVENTARIO (SOFT DELETE)
export const deleteInventario = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await pool.query(`
            UPDATE inventario 
            SET activo = 0
            WHERE id = ? AND activo = 1
        `, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Inventario no encontrado" });
        }

        res.json({ message: "Inventario eliminado correctamente" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// Verificar stock

export const verificarStock = async (req, res) => {
    const { productos } = req.body;

    if (!productos || !Array.isArray(productos)) {
        return res.status(400).json({ error: 'Datos inválidos' });
    }

    try {
        const ids = productos.map(p => p.id);

        if (ids.length === 0) {
            return res.json({ noStock: [] });
        }

        const placeholders = ids.map(() => '?').join(',');

        const query = `
            SELECT i.id_producto, i.stock, p.nombre
            FROM inventario i
            INNER JOIN productos p ON i.id_producto = p.id
            WHERE i.id_producto IN (${placeholders})
            AND i.activo = 1
        `;

        const [rows] = await pool.query(query, ids);

        // 🔥 Crear mapa rápido
        const inventarioMap = new Map();
        rows.forEach(item => {
            inventarioMap.set(item.id_producto, item);
        });

        // 🔍 Verificar stock
        const noStock = productos
            .filter(p => {
                const item = inventarioMap.get(p.id);
                return !item || item.stock < p.cantidad;
            })
            .map(p => {
                const item = inventarioMap.get(p.id);
                return {
                    id: p.id,
                    nombre: item ? item.nombre : 'Producto no encontrado',
                    stockDisponible: item ? item.stock : 0,
                    solicitado: p.cantidad
                };
            });

        res.json({ noStock });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};