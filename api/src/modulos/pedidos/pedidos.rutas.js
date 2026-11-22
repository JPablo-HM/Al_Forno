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

// Reglas del carrito (las usan el pago normal y el de PayPal).
const reglasProductos = [
  body('productos').isArray({ min: 1 }).withMessage('El carrito está vacío'),
  body('productos.*.producto_id').isInt({ min: 1 }).withMessage('Producto inválido').toInt(),
  body('productos.*.cantidad').isInt({ min: 1, max: 10 }).withMessage('La cantidad debe ser de 1 a 10').toInt(),
];

// POST /api/pedidos (HU-07, HU-08) · Pagar y crear el pedido
// Cuerpo: { productos: [{ producto_id, cantidad }],
//           metodo_pago: 'Tarjeta' | 'SINPE Móvil',
//           tarjeta: { numero, vencimiento, cvv }   ← solo con Tarjeta
//           telefono: '88881111' }                  ← solo con SINPE Móvil
// Aquí se revisa solo el FORMATO. La marca, si la tarjeta existe, el
// vencimiento y el saldo los revisa el socio Banco Simulado.
const conTarjeta = body('metodo_pago').equals('Tarjeta');
const conSinpe = body('metodo_pago').equals('SINPE Móvil');

router.post(
  '/',
  reglasProductos,
  body('metodo_pago').isIn(['Tarjeta', 'SINPE Móvil']).withMessage('Elige cómo pagar'),
  // .if(...) → esa regla solo se revisa con ese método de pago.
  // customSanitizer quita los espacios: '4111 1111 1111 1111' → '4111111111111111'
  body('tarjeta.numero').if(conTarjeta).customSanitizer((v) => String(v ?? '').replace(/\s/g, ''))
    .matches(/^\d{15,16}$/).withMessage('El número de tarjeta debe tener 15 o 16 dígitos'),
  // MM/AA con mes de 01 a 12
  body('tarjeta.vencimiento').if(conTarjeta).trim()
    .matches(/^(0[1-9]|1[0-2])\/\d{2}$/).withMessage('El vencimiento debe ser MM/AA'),
  body('tarjeta.cvv').if(conTarjeta).trim().matches(/^\d{3,4}$/).withMessage('El CVV debe tener 3 o 4 dígitos'),
  body('telefono').if(conSinpe).customSanitizer((v) => String(v ?? '').replace(/[\s-]/g, ''))
    .matches(/^\d{8}$/).withMessage('El teléfono debe tener 8 dígitos'),
  validar,
  async (req, res) => {
    const { productos, metodo_pago, tarjeta, telefono } = req.body;
    const comprobante = await pedidosServicio.crearPedido(req.usuario.id, productos, { metodo_pago, tarjeta, telefono });
    res.status(201).json(comprobante);
  }
);

// POST /api/pedidos/paypal (HU-07, HU-08) · Paso 1 del pago con PayPal
// Cuerpo: { productos: [{ producto_id, cantidad }] }
// Responde { orden, link, dolares, venta }: la app abre el link para que el
// cliente apruebe el pago en PayPal.
router.post('/paypal', reglasProductos, validar, async (req, res) => {
  res.status(201).json(await pedidosServicio.iniciarPagoPaypal(req.usuario.id, req.body.productos));
});

// POST /api/pedidos/paypal/confirmar (HU-07, HU-08) · Paso 2 del pago con PayPal
// Cuerpo: { orden }. Cobra la orden ya aprobada y crea el pedido.
// Responde el comprobante (igual que POST /api/pedidos).
router.post(
  '/paypal/confirmar',
  body('orden').isString().trim().notEmpty().withMessage('Falta el pago de PayPal'),
  validar,
  async (req, res) => {
    res.status(201).json(await pedidosServicio.confirmarPagoPaypal(req.usuario.id, req.body.orden));
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
