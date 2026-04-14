import { Router } from 'express';
import { createProveedor, deleteProveedor, getProveedores, updateProveedor } from '../controllers/proveedores.controller.js';

const router = Router();

// 📦 GET proveedores
router.get('/proveedores', getProveedores);

router.post('/proveedores', createProveedor);

router.put('/proveedores/:id', updateProveedor);

router.delete('/proveedores/:id', deleteProveedor);

export default router;