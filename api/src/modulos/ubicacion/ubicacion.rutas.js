// CAPA API (rutas) del módulo Ubicación (HU-01 Registro).
// Llenan las 3 cajas del registro en cascada: cada caja se pide solo
// cuando hace falta, y la app actualiza solo esa caja (sin recargar la
// pantalla). Son públicas: el registro se hace sin sesión.
const { Router } = require('express');
const { query } = require('express-validator');
const ubicacionServicio = require('./ubicacion.servicio');
const validar = require('../../middlewares/validar');

const router = Router();

// Este router se monta en '/api/ubicacion' (ver modulos/index.js).

// GET /api/ubicacion/paises · Al abrir el registro
router.get('/paises', async (req, res) => {
  res.json(await ubicacionServicio.listarPaises());
});

// GET /api/ubicacion/provincias?pais=1 · Al elegir un país
router.get(
  '/provincias',
  query('pais').isInt({ min: 1 }).withMessage('País inválido').toInt(),
  validar,
  async (req, res) => {
    res.json(await ubicacionServicio.listarProvincias(req.query.pais));
  }
);

// GET /api/ubicacion/cantones?provincia=1 · Al elegir una provincia
router.get(
  '/cantones',
  query('provincia').isInt({ min: 1 }).withMessage('Provincia inválida').toInt(),
  validar,
  async (req, res) => {
    res.json(await ubicacionServicio.listarCantones(req.query.provincia));
  }
);

module.exports = router;
