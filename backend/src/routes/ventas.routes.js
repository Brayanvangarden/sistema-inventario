import { Router } from 'express';
import { crearVenta, getVentas, getVentaDetalle } from '../controllers/ventas.controller.js';

const router = Router();

// 💰 CREAR
router.post('/ventas', crearVenta);

// 📦 LISTAR
router.get('/ventas', getVentas);

// 📄 DETALLE
router.get('/ventas/:id', getVentaDetalle);

export default router;