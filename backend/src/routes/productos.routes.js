// src/routes/productos.routes.js

import { Router } from 'express';
import {
    getProductos,
    createProducto,
    updateProducto,
    deleteProducto
} from '../controllers/productos.controller.js';

const router = Router();

// Para paginación y listado general
router.get('/productos', getProductos);
router.post('/productos', createProducto);
router.put('/productos/:id', updateProducto);
router.delete('/productos/:id', deleteProducto);

export default router;