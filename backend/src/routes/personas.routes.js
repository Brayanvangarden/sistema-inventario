import { Router } from 'express';
import {
    createPersona,
    getPersonas,
    updatePersona,
    deletePersona

} from '../controllers/personas.controller.js';

const router = Router();

// 📦 GET PERSONAS
router.get('/personas', getPersonas);

// ➕ CREAR Persona
router.post('/personas', createPersona);

// ✏️ ACTUALIZAR Persona
router.put('/personas/:id', updatePersona);

// 🗑️ ELIMINAR PRODUCTO (soft delete)
router.delete('/personas/:id', deletePersona);

export default router;