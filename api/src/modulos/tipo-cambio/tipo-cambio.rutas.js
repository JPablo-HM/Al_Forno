// CAPA API (rutas) del módulo Tipo de cambio.
// Es pública: Inicio y Carrito muestran el tipo de cambio, por eso no pide token.
const { Router } = require('express');
const tipoCambioServicio = require('./tipo-cambio.servicio');

const router = Router();

// Este router se monta en '/api/tipo-cambio' (ver modulos/index.js), así que
// '/' queda como GET /api/tipo-cambio → { compra: 441.91, venta: 446.17, fecha: '2026-11-21' }
router.get('/', async (req, res) => {
  res.json(await tipoCambioServicio.obtenerTipoCambio());
});

module.exports = router;
