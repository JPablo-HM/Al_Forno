// CAPA API (rutas) del módulo Menú (HU-03).
// Es pública: el menú se ve sin iniciar sesión, por eso no pide token.
const { Router } = require('express');
const menuController = require('../controllers/menu.controller');

const router = Router();

// Este router se monta en '/api/menu' (ver routes/index.js), así que:
// router.get('/') queda como GET /api/menu.
router.get('/', menuController.obtenerMenu);

module.exports = router;
