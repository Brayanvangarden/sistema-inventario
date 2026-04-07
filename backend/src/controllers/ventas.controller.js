import { pool } from '../config/db.js';

// 💰 CREAR VENTA COMPLETA
export const crearVenta = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const { id_persona, id_usuario, id_metodo_pago, productos } = req.body;

        /*
        productos = [
            { id_producto: 1, cantidad: 2 },
            { id_producto: 3, cantidad: 1 }
        ]
        */

        if (!id_usuario || !productos || productos.length === 0) {
            return res.status(400).json({ error: "Datos incompletos" });
        }

        await connection.beginTransaction();

        let total = 0;

        // 🧾 1. CALCULAR TOTAL + VALIDAR STOCK
        for (const item of productos) {
            const [productoDB] = await connection.query(
                `SELECT p.precio_venta, i.stock 
                 FROM productos p
                 INNER JOIN inventario i ON p.id = i.id_producto
                 WHERE p.id = ?`,
                [item.id_producto]
            );

            if (productoDB.length === 0) {
                throw new Error(`Producto no existe ID ${item.id_producto}`);
            }

            const { precio_venta, stock } = productoDB[0];

            if (stock < item.cantidad) {
                throw new Error(`Stock insuficiente para producto ID ${item.id_producto}`);
            }

            total += precio_venta * item.cantidad;
        }

        // 🧾 2. CREAR FACTURA
        const [factura] = await connection.query(`
            INSERT INTO factura (id_persona, id_usuario, total, estado, id_metodo_pago)
            VALUES (?, ?, ?, 'PAGADA', ?)
        `, [id_persona || null, id_usuario, total, id_metodo_pago || null]);

        const id_factura = factura.insertId;

        // 🧾 3. INSERTAR DETALLE + ACTUALIZAR INVENTARIO
        for (const item of productos) {

            const [productoDB] = await connection.query(
                `SELECT precio_venta 
                 FROM productos 
                 WHERE id = ?`,
                [item.id_producto]
            );

            const precio = productoDB[0].precio_venta;
            const subtotal = precio * item.cantidad;

            // 📦 detalle
            await connection.query(`
                INSERT INTO factura_detalle (id_factura, id_producto, cantidad, precio, subtotal)
                VALUES (?, ?, ?, ?, ?)
            `, [id_factura, item.id_producto, item.cantidad, precio, subtotal]);

            // 📉 descontar inventario
            await connection.query(`
                UPDATE inventario 
                SET stock = stock - ?
                WHERE id_producto = ?
            `, [item.cantidad, item.id_producto]);

            // 📊 registrar movimiento
            await connection.query(`
                INSERT INTO movimientos (id_producto, tipo, cantidad, descripcion)
                VALUES (?, 'SALIDA', ?, 'Venta')
            `, [item.id_producto, item.cantidad]);
        }

        await connection.commit();

        res.json({
            message: "Venta realizada correctamente 💰",
            id_factura
        });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
};

// 📦 GET VENTAS
export const getVentas = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                f.id,
                f.fecha,
                f.total,
                f.estado,
                CONCAT(p.nombre, ' ', p.apellido) AS cliente,
                u.usuario
            FROM factura f
            LEFT JOIN persona p ON f.id_persona = p.id
            INNER JOIN usuarios u ON f.id_usuario = u.id
            ORDER BY f.id DESC
        `);

        res.json(rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// 📄 GET DETALLE DE VENTA
export const getVentaDetalle = async (req, res) => {
    try {
        const { id } = req.params;

        // 🧾 encabezado
        const [factura] = await pool.query(`
            SELECT 
                f.id,
                f.fecha,
                f.total,
                f.estado,
                CONCAT(p.nombre, ' ', p.apellido) AS cliente,
                u.usuario
            FROM factura f
            LEFT JOIN persona p ON f.id_persona = p.id
            INNER JOIN usuarios u ON f.id_usuario = u.id
            WHERE f.id = ?
        `, [id]);

        if (factura.length === 0) {
            return res.status(404).json({ error: "Factura no encontrada" });
        }

        // 📦 detalle
        const [detalle] = await pool.query(`
            SELECT 
                d.id_producto,
                pr.nombre,
                d.cantidad,
                d.precio,
                d.subtotal
            FROM factura_detalle d
            INNER JOIN productos pr ON d.id_producto = pr.id
            WHERE d.id_factura = ?
        `, [id]);

        res.json({
            factura: factura[0],
            detalle
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};