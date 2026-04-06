import { Router } from 'express';
import {
    getProductos,
    createProducto,
    updateProducto,
    deleteProducto
} from '../controllers/productos.controller.js';

const router = Router();

// 📦 OBTENER PRODUCTOS (con paginación desde controller)
router.get('/productos', getProductos);

// ➕ CREAR PRODUCTO
router.post('/productos', createProducto);

// ✏️ ACTUALIZAR PRODUCTO
router.put('/productos/:id', updateProducto);

// 🗑️ ELIMINAR PRODUCTO (soft delete)
router.delete('/productos/:id', deleteProducto);

export default router;