// CAPA API (rutas) del módulo Información (pantalla Inicio · HU-04, 05, 06).
// Define cada endpoint y lo que hace al recibir la petición: llama al
// servicio y responde en JSON. Son públicas: se ven sin iniciar sesión,
// por eso no piden token.
const { Router } = require('express');
const informacionServicio = require('./informacion.servicio');

const router = Router();

// Este router se monta en '/api' (ver modulos/index.js), así que
// '/horario' queda como GET /api/horario, y así con las demás.

// GET /api/horario (HU-04) · No usa la base de datos: no necesita async.
router.get('/horario', (req, res) => {
  res.json(informacionServicio.obtenerHorario());
});

// GET /api/restaurante (HU-05) · No usa la base de datos: no necesita async.
router.get('/restaurante', (req, res) => {
  res.json(informacionServicio.obtenerRestaurante());
});

// GET /api/promociones (HU-06) · Lee MySQL: espera la respuesta con await.
router.get('/promociones', async (req, res) => {
  res.json(await informacionServicio.listarPromociones());
});

module.exports = router;
