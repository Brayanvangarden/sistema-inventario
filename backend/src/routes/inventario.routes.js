import { Router } from 'express';
import { createInventario, deleteInventario, getInventario, updateInventario } from '../controllers/inventario.controller.js';

const router = Router();

// 📦 GET Inventario
router.get('/inventario', getInventario);
router.post('/inventario', createInventario);
router.put('/inventario/:id', updateInventario);
router.delete('/inventario/:id', deleteInventario);

export default router;