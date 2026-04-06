import express from 'express';
import { getCategorias } from '../controllers/categorias.controller.js';

const router = express.Router();

router.get('/categorias', getCategorias);

export default router;