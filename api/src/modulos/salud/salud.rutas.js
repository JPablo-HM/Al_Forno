// CAPA API (rutas) del módulo Salud.
// Define el endpoint y lo que hace al recibir la petición: llama al
// servicio y responde en JSON. No tiene reglas de negocio.
const { Router } = require('express');
const saludServicio = require('./salud.servicio');

const router = Router();

// GET /api/salud → comprueba que la API y MySQL responden.
// req = la petición (parámetros, cuerpo JSON, token); res = la respuesta.
// async/await: espera al servicio sin bloquear la API mientras tanto.
// Si el servicio lanza un error, Express 5 lo pasa solo al middleware de
// errores (middlewares/errores.js), por eso aquí no hace falta try/catch.
router.get('/salud', async (req, res) => {
  const estado = await saludServicio.obtenerEstado();
  res.json(estado); // responde con código 200 y el objeto en JSON
});

module.exports = router;
