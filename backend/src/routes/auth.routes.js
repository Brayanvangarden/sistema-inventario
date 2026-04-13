import express from 'express';
import { login, recuperarContrasena } from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/login', login);
router.post("/recuperar", recuperarContrasena); 

export default router;