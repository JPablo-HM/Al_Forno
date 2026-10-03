// Configuración de Express: seguridad, JSON, rutas y manejo de errores.
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rutas = require('./routes');
const { noEncontrado, manejarErrores } = require('./middlewares/errores');

const app = express();

app.use(helmet());          // Encabezados de seguridad
app.use(cors());            // Permite que la app móvil llame a la API
app.use(express.json());    // Lee el cuerpo de las peticiones en JSON

app.use('/api', rutas);     // Todas las rutas empiezan con /api

app.use(noEncontrado);      // 404 para rutas que no existen
app.use(manejarErrores);    // Errores centralizados

module.exports = app;
