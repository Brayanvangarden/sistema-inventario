import express from 'express';
import cors from 'cors';

import productosRoutes from './routes/productos.routes.js';
import categoriasRoutes from './routes/categorias.routes.js';
import authRoutes from './routes/auth.routes.js';
import personasRoutes from './routes/personas.routes.js';


const app = express();

app.use(cors());
app.use(express.json());

// RUTAS
app.use('/api', authRoutes);
app.use('/api', productosRoutes);
app.use('/api', categoriasRoutes);
app.use('/api', personasRoutes);

// TEST
app.get('/', (req, res) => {
    res.send('Servidor funcionando 🚀');
});

app.listen(3000, () => {
    console.log('Servidor corriendo en http://localhost:3000');
});