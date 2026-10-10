// CAPA API (rutas) del módulo Menú (HU-03).
// Define el endpoint y lo que hace al recibir la petición: llama al
// servicio y responde en JSON. Es pública: el menú se ve sin iniciar
// sesión, por eso no pide token.
const { Router } = require('express');
const menuServicio = require('./menu.servicio');

const router = Router();

// Este router se monta en '/api/menu' (ver modulos/index.js), así que
// '/' queda como GET /api/menu.
router.get('/', async (req, res) => {
  res.json(await menuServicio.obtenerMenu());
});

module.exports = router;
