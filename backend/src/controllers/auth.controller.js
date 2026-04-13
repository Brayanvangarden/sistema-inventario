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
export const recuperarContrasena = async (req, res) => {
  const { usuario } = req.body;

  try {
    // Buscar usuario + correo desde persona
    const [rows] = await pool.query(`
      SELECT u.id, u.usuario, p.correo, CONCAT(p.nombre, ' ', p.apellido) AS nombre
      FROM usuarios u
      INNER JOIN persona p ON u.id_persona = p.id
      WHERE u.usuario = ? AND u.activo = 1
    `, [usuario]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const user = rows[0];

    // Generar contraseña temporal
    const temporal = Math.random().toString(36).slice(-8); // ej: "k3f9xw2q"
    const hash = await bcrypt.hash(temporal, 10);

    // Guardar en DB
    await pool.query(
      "UPDATE usuarios SET contrasena = ? WHERE id = ?",
      [hash, user.id]
    );

    // Enviar correo
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `"Suplidora y Academia Style" <${process.env.MAIL_USER}>`,
      to: user.correo,
      subject: "🔐 Recuperación de contraseña",
      html: `
        <div style="font-family:Arial,sans-serif; max-width:460px; margin:auto; border:1px solid #ddd; border-radius:10px; overflow:hidden;">
          <div style="background:#7c3aed; color:white; padding:20px; text-align:center;">
            <h2 style="margin:0;">Suplidora y Academia Style</h2>
            <p style="margin:4px 0; font-size:13px;">Recuperación de contraseña</p>
          </div>
          <div style="padding:24px;">
            <p>Hola <strong>${user.nombre}</strong>,</p>
            <p>Tu contraseña temporal es:</p>
            <div style="background:#f3e5f5; border-radius:8px; padding:16px; text-align:center; font-size:24px; font-weight:bold; letter-spacing:4px; color:#7c3aed; margin:16px 0;">
              ${temporal}
            </div>
            <p style="font-size:13px; color:#888;">Por seguridad, cambiá tu contraseña después de ingresar.</p>
          </div>
          <div style="background:#f9f9f9; padding:12px; text-align:center; font-size:11px; color:#bbb;">
            Si no solicitaste esto, ignorá este correo.
          </div>
        </div>
      `
    });

    res.json({ ok: true, mensaje: "Contraseña temporal enviada al correo registrado" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al procesar la solicitud" });
  }
};