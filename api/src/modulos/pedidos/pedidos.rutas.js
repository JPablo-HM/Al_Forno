// CAPA API (rutas) del módulo Pedidos (HU-07, HU-08, HU-09).
// Todas piden sesión de CLIENTE: verificarToken deja en req.usuario el
// { id, rol } del token, y con ese id cada cliente solo ve SUS pedidos.
const { Router } = require('express');
const { body, param } = require('express-validator');
const pedidosServicio = require('./pedidos.servicio');
const validar = require('../../middlewares/validar');
const { verificarToken, soloRol } = require('../../middlewares/autenticacion');

const router = Router();

// Este router se monta en '/api/pedidos' (ver modulos/index.js).
// router.use aplica los dos middlewares a TODAS las rutas de este archivo.
router.use(verificarToken, soloRol('CLIENTE'));

// POST /api/pedidos (HU-07, HU-08) · Pagar y crear el pedido
// Cuerpo: { productos: [{ producto_id, cantidad }],
//           tarjeta: { numero, titular, vencimiento, cvv } }
router.post(
  '/',
  body('productos').isArray({ min: 1 }).withMessage('El carrito está vacío'),
  body('productos.*.producto_id').isInt({ min: 1 }).withMessage('Producto inválido').toInt(),
  body('productos.*.cantidad').isInt({ min: 1, max: 10 }).withMessage('La cantidad debe ser de 1 a 10').toInt(),
  // customSanitizer quita los espacios: '4111 1111 1111 1111' → '4111111111111111'
  body('tarjeta.numero').customSanitizer((v) => String(v ?? '').replace(/\s/g, ''))
    .matches(/^\d{16}$/).withMessage('El número de tarjeta debe tener 16 dígitos'),
  body('tarjeta.titular').trim().notEmpty().withMessage('Escribe el nombre del titular'),
  // MM/AA con mes de 01 a 12
  body('tarjeta.vencimiento').trim().matches(/^(0[1-9]|1[0-2])\/\d{2}$/).withMessage('El vencimiento debe ser MM/AA'),
  body('tarjeta.cvv').trim().matches(/^\d{3}$/).withMessage('El CVV debe tener 3 dígitos'),
  validar,
  async (req, res) => {
    const comprobante = await pedidosServicio.crearPedido(req.usuario.id, req.body.productos, req.body.tarjeta);
    res.status(201).json(comprobante);
  }
);

// GET /api/pedidos (HU-09) · Mis pedidos
router.get('/', async (req, res) => {
  res.json(await pedidosServicio.listarMisPedidos(req.usuario.id));
});

// GET /api/pedidos/:id (HU-08, HU-09) · Detalle y comprobante
router.get(
  '/:id',
  param('id').isInt({ min: 1 }).withMessage('Número de pedido inválido').toInt(),
  validar,
  async (req, res) => {
    res.json(await pedidosServicio.obtenerPedido(req.params.id, req.usuario.id));
  }
);

module.exports = router;
