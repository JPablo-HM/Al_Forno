// CAPA API (rutas) del módulo Información (HU-04, 05, 06).
// Son públicas: se ven sin iniciar sesión, por eso no piden token.
const { Router } = require('express');
const informacionController = require('../controllers/informacion.controller');

const router = Router();

// Este router se monta en '/api' (ver routes/index.js), así que:
// router.get('/horario') queda como GET /api/horario, y así con las demás.
router.get('/horario', informacionController.obtenerHorario);         // HU-04
router.get('/restaurante', informacionController.obtenerRestaurante); // HU-05
router.get('/promociones', informacionController.listarPromociones);  // HU-06

module.exports = router;
