import { Router } from 'express';
import { getVentas, getVentaDetalle, crearFactura, pagarFactura, getFacturasConDetalles, reenviarFactura  } from '../controllers/ventas.controller.js';

const router = Router();

// 💰 CREAR
router.post('/ventas', crearFactura);
router.put('/ventas/pagar/:id', pagarFactura);

// 📦 LISTAR (simple)
router.get('/ventas', getVentas);

// 📄 DETALLE POR ID
router.get('/ventas/:id', getVentaDetalle);

// 📋 TODAS CON DETALLES (para Postman o reportes)
router.get('/ventas/detalle/todas', getFacturasConDetalles); 


router.post("/reenviar/:id", reenviarFactura);

export default router;