import { pool } from '../config/db.js';
import nodemailer from 'nodemailer';


// 🧾 CREAR FACTURA (PENDIENTE)
export const crearFactura = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const { id_persona, id_usuario, productos } = req.body;

        if (!id_usuario || !productos || productos.length === 0) {
            return res.status(400).json({ error: "Datos incompletos" });
        }

        await connection.beginTransaction();

        let total = 0;

        // 🧾 1. CALCULAR TOTAL (SIN VALIDAR STOCK)
        for (const item of productos) {

            const [productoDB] = await connection.query(
                `SELECT precio_venta 
                 FROM productos 
                 WHERE id = ?`,
                [item.id_producto]
            );

            if (productoDB.length === 0) {
                throw new Error(`Producto no existe ID ${item.id_producto}`);
            }

            const precio = productoDB[0].precio_venta;
            total += precio * item.cantidad;
        }

        // 🧾 2. CREAR FACTURA (PENDIENTE)
        const [factura] = await connection.query(`
            INSERT INTO factura (id_persona, id_usuario, total, estado)
            VALUES (?, ?, ?, 'PENDIENTE')
        `, [id_persona || null, id_usuario, total]);

        const id_factura = factura.insertId;

        // 🧾 3. INSERTAR DETALLE (SIN TOCAR INVENTARIO)
        for (const item of productos) {

            const [productoDB] = await connection.query(
                `SELECT precio_venta 
                 FROM productos 
                 WHERE id = ?`,
                [item.id_producto]
            );

            const precio = productoDB[0].precio_venta;
            const subtotal = precio * item.cantidad;

            await connection.query(`
                INSERT INTO factura_detalle (id_factura, id_producto, cantidad, precio, subtotal)
                VALUES (?, ?, ?, ?, ?)
            `, [id_factura, item.id_producto, item.cantidad, precio, subtotal]);
        }

        await connection.commit();

        res.json({
            message: "Factura creada (pendiente de pago) 🧾",
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
    const pagina = parseInt(req.query.page)  || 1;
    const limite = parseInt(req.query.limit) || 10;
    const offset = (pagina - 1) * limite;

    const { cliente, fecha, estado } = req.query;

    let query = `
      SELECT 
        f.id, f.fecha, f.total, f.estado,
        CONCAT(p.nombre, ' ', p.apellido) AS cliente,
        u.usuario
      FROM factura f
      LEFT JOIN persona p ON f.id_persona = p.id
      INNER JOIN usuarios u ON f.id_usuario = u.id
      WHERE 1=1
    `;

    const params = [];

    if (cliente && cliente.trim() !== "") {
      query += ` AND LOWER(CONCAT(p.nombre, ' ', p.apellido)) LIKE ?`;
      params.push(`%${cliente.toLowerCase()}%`);
    }

    if (fecha && fecha.trim() !== "") {
      query += ` AND DATE(f.fecha) = ?`;
      params.push(fecha);
    }

    if (estado && estado.trim() !== "") {
      query += ` AND f.estado = ?`;
      params.push(estado);
    }

    query += ` ORDER BY f.id DESC LIMIT ? OFFSET ?`;
    params.push(limite, offset);

    const [rows] = await pool.query(query, params);
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

export const pagarFactura = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const { id } = req.params;
        const { id_metodo_pago } = req.body;

        if (!id_metodo_pago) {
            return res.status(400).json({ error: "Debe indicar método de pago" });
        }

        await connection.beginTransaction();

        // 🔍 1. Verificar factura
        const [factura] = await connection.query(
            "SELECT * FROM factura WHERE id = ? AND estado = 'PENDIENTE'",
            [id]
        );

        if (factura.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: "Factura no encontrada o ya pagada" });
        }

        // 🔍 2. Obtener detalle
        const [detalle] = await connection.query(`
            SELECT fd.*, i.stock
            FROM factura_detalle fd
            JOIN inventario i ON fd.id_producto = i.id_producto
            WHERE fd.id_factura = ?
        `, [id]);

        // 🔥 3. VALIDAR STOCK
        for (const item of detalle) {
            if (item.stock < item.cantidad) {
                await connection.rollback();
                return res.status(400).json({
                    error: `Stock insuficiente para producto ID ${item.id_producto}`
                });
            }
        }

        // 📉 4. DESCONTAR INVENTARIO + MOVIMIENTOS
        for (const item of detalle) {
            // Descontar stock
            await connection.query(`
                UPDATE inventario
                SET stock = stock - ?
                WHERE id_producto = ?
            `, [item.cantidad, item.id_producto]);

            // Insertar movimiento
            await connection.query(`
                INSERT INTO movimientos (id_producto, tipo, cantidad, descripcion)
                VALUES (?, 'SALIDA', ?, 'Venta realizada')
            `, [item.id_producto, item.cantidad]);
        }

        // 💰 5. ACTUALIZAR FACTURA
        await connection.query(`
            UPDATE factura
            SET estado = 'PAGADA',
                id_metodo_pago = ?
            WHERE id = ?
        `, [id_metodo_pago, id]);

        await connection.commit();

        res.json({ message: "Factura pagada correctamente 💰" });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ error: error.message });

    } finally {
        connection.release();
    }
};

// GET todas las facturas con detalles
export const getFacturasConDetalles = async (req, res) => {
  try {
    // Obtener todas las facturas
    const [facturas] = await pool.query(`
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

    // Para cada factura, obtener sus detalles
    const facturasConDetalle = await Promise.all(
      facturas.map(async (factura) => {
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
        `, [factura.id]);
        console.log("Factura:", factura.id, "Detalle:", detalle);

        return {
          ...factura,
          detalles: detalle,
        };
      })
    );

    res.json(facturasConDetalle);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export const reenviarFactura = async (req, res) => {
  const { id } = req.params;

  try {
    // ✅ Tablas y campos correctos de tu DB
    const [facturas] = await pool.query(`
      SELECT 
        f.id,
        f.fecha,
        f.total,
        f.estado,
        CONCAT(p.nombre, ' ', p.apellido) AS nombre_cliente,
        p.correo AS correo_cliente,
        u.usuario
      FROM factura f
      LEFT JOIN persona p ON f.id_persona = p.id
      INNER JOIN usuarios u ON f.id_usuario = u.id
      WHERE f.id = ?
    `, [id]);

    if (!facturas.length) {
      return res.status(404).json({ error: "Factura no encontrada" });
    }

    const factura = facturas[0];

    if (!factura.correo_cliente) {
      return res.status(400).json({ error: "El cliente no tiene correo registrado" });
    }

    // ✅ Detalle con tablas correctas
    const [detalles] = await pool.query(`
      SELECT 
        pr.nombre,
        d.cantidad,
        d.precio,
        d.subtotal
      FROM factura_detalle d
      INNER JOIN productos pr ON d.id_producto = pr.id
      WHERE d.id_factura = ?
    `, [id]);

    // ✅ Armar filas del correo
    const filasProductos = detalles.map(d => `
      <tr>
        <td style="padding:6px; border-bottom:1px solid #eee;">${d.nombre}</td>
        <td style="padding:6px; border-bottom:1px solid #eee; text-align:center;">${d.cantidad}</td>
        <td style="padding:6px; border-bottom:1px solid #eee; text-align:right;">₡${parseFloat(d.precio).toFixed(2)}</td>
        <td style="padding:6px; border-bottom:1px solid #eee; text-align:right;">₡${parseFloat(d.subtotal).toFixed(2)}</td>
      </tr>
    `).join("");

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `"Suplidora y Academia Style" <${process.env.MAIL_USER}>`,
      to: factura.correo_cliente,
      subject: `🧾 Factura #${id} - Suplidora y Academia Style`,
      html: `
        <div style="font-family:Arial,sans-serif; max-width:500px; margin:auto; border:1px solid #ddd; border-radius:8px; overflow:hidden;">
          <div style="background:#2e7d32; color:white; padding:20px; text-align:center;">
            <h2 style="margin:0;">Suplidora y Academia Style</h2>
            <p style="margin:4px 0; font-size:13px;">Factura #${factura.id}</p>
          </div>
          <div style="padding:20px;">
            <p><strong>Cliente:</strong> ${factura.nombre_cliente || "Contado"}</p>
            <p><strong>Cajero:</strong> ${factura.usuario}</p>
            <p><strong>Fecha:</strong> ${new Date(factura.fecha).toLocaleString()}</p>
            <p><strong>Estado:</strong> ${factura.estado}</p>
            <table style="width:100%; border-collapse:collapse; margin-top:16px;">
              <thead style="background:#f5f5f5;">
                <tr>
                  <th style="padding:8px; text-align:left;">Producto</th>
                  <th style="padding:8px; text-align:center;">Cant</th>
                  <th style="padding:8px; text-align:right;">Precio</th>
                  <th style="padding:8px; text-align:right;">Subtotal</th>
                </tr>
              </thead>
              <tbody>${filasProductos}</tbody>
            </table>
            <div style="text-align:right; margin-top:16px; font-size:18px; font-weight:bold; color:#2e7d32;">
              TOTAL: ₡${parseFloat(factura.total).toFixed(2)}
            </div>
          </div>
          <div style="background:#f9f9f9; padding:14px; text-align:center; font-size:12px; color:#999;">
            ¡Gracias por su compra! 🌸
          </div>
        </div>
      `
    });

    res.json({ ok: true, mensaje: `Factura enviada a ${factura.correo_cliente}` });

  } catch (error) {
    console.error("Error enviando correo:", error);
    res.status(500).json({ error: "Error al enviar el correo" });
  }
};