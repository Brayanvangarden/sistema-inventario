import express from 'express';
import {
    getCategorias,
    createCategoria,
    updateCategoria,
    deleteCategoria,
} from '../controllers/categorias.controller.js';

const router = express.Router();

router.get('/categorias', getCategorias);
router.post('/categorias', createCategoria);
router.put('/categorias/:id', updateCategoria);
router.delete('/categorias/:id', deleteCategoria);

export default router;