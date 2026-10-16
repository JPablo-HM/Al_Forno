// CAPA API (rutas) del módulo Reservas (HU-10, HU-11).
// Todas piden sesión de CLIENTE: con el id del token, cada cliente
// solo ve y cancela SUS reservas.
const { Router } = require('express');
const { body, param, query } = require('express-validator');
const reservasServicio = require('./reservas.servicio');
const validar = require('../../middlewares/validar');
const { verificarToken, soloRol } = require('../../middlewares/autenticacion');

const router = Router();

// Este router se monta en '/api/reservas' (ver modulos/index.js).
router.use(verificarToken, soloRol('CLIENTE'));

const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD

// GET /api/reservas/horas?fecha=2026-10-17 (HU-10) · Horas y espacios libres
// Va ANTES de las rutas con :id para que "horas" no se confunda con un id.
router.get(
  '/horas',
  query('fecha').matches(FORMATO_FECHA).withMessage('Fecha inválida'),
  validar,
  async (req, res) => {
    res.json(await reservasServicio.listarHoras(req.query.fecha));
  }
);

// POST /api/reservas (HU-10) · Crear reserva
// Cuerpo: { fecha, hora, personas }
router.post(
  '/',
  body('fecha').matches(FORMATO_FECHA).withMessage('Escoge un día'),
  body('hora').matches(/^\d{2}:\d{2}$/).withMessage('Escoge una hora'),
  body('personas').isInt({ min: 1, max: 8 })
    .withMessage('De 1 a 8 personas. Para grupos más grandes, llama al restaurante').toInt(),
  validar,
  async (req, res) => {
    const { fecha, hora, personas } = req.body;
    res.status(201).json(await reservasServicio.crearReserva(req.usuario.id, { fecha, hora, personas }));
  }
);

// GET /api/reservas (HU-11) · Mis reservas de hoy en adelante
router.get('/', async (req, res) => {
  res.json(await reservasServicio.listarMisReservas(req.usuario.id));
});

// PATCH /api/reservas/:id/cancelar (HU-11) · Cancelar una reserva confirmada
// PATCH = cambiar una parte del recurso (aquí, solo el estado).
router.patch(
  '/:id/cancelar',
  param('id').isInt({ min: 1 }).withMessage('Reserva inválida').toInt(),
  validar,
  async (req, res) => {
    res.json(await reservasServicio.cancelarReserva(req.params.id, req.usuario.id));
  }
);

module.exports = router;
