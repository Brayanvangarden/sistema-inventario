import { Router } from 'express';
import { getVentas, getVentaDetalle, crearFactura, pagarFactura } from '../controllers/ventas.controller.js';

const router = Router();

// 💰 CREAR
router.post('/ventas', crearFactura );

router.put('/ventas/pagar/:id',pagarFactura)

// 📦 LISTAR
router.get('/ventas', getVentas);

// 📄 DETALLE
router.get('/ventas/:id', getVentaDetalle);

export default router;