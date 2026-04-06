import { Router } from 'express';
import { getUsuarios, createUsuario, updateUsuario, deleteUsuario } from '../controllers/usuarios.controller.js';

const router = Router();

// 📦 GET usuarios
router.get('/usuarios', getUsuarios);
router.post('/usuarios', createUsuario);
router.put('/usuarios/:id', updateUsuario);
router.delete('/usuarios/:id', deleteUsuario);

export default router;