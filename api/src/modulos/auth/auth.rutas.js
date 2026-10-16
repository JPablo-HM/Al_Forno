// CAPA API (rutas) del módulo Cuenta (HU-01, HU-02, HU-14).
// Cada ruta: primero las validaciones de los datos (express-validator),
// luego validar (responde 400 si algo está mal) y al final el servicio.
const { Router } = require('express');
const { body } = require('express-validator');
const authServicio = require('./auth.servicio');
const validar = require('../../middlewares/validar');
const { verificarToken } = require('../../middlewares/autenticacion');

const router = Router();

// Este router se monta en '/api/auth' (ver modulos/index.js).

// POST /api/auth/registro (HU-01) · Público
// trim() quita espacios al inicio y al final antes de validar.
router.post(
  '/registro',
  body('nombre_completo').trim().notEmpty().withMessage('Escribe tu nombre completo')
    .isLength({ max: 100 }).withMessage('El nombre es muy largo'),
  body('cedula').trim().matches(/^\d{9}$/).withMessage('La cédula debe tener 9 dígitos'),
  body('telefono').trim().matches(/^\d{8}$/).withMessage('El teléfono debe tener 8 dígitos'),
  body('correo').trim().toLowerCase().isEmail().withMessage('Escribe un correo válido'),
  body('contrasena').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),
  validar,
  async (req, res) => {
    const { nombre_completo, cedula, telefono, correo, contrasena } = req.body;
    // 201 = "creado"
    res.status(201).json(await authServicio.registrar({ nombre_completo, cedula, telefono, correo, contrasena }));
  }
);

// POST /api/auth/login (HU-02, HU-14) · Público
// Aquí no se valida el formato del correo: solo que no venga vacío.
router.post(
  '/login',
  body('correo').trim().toLowerCase().notEmpty().withMessage('Escribe tu correo'),
  body('contrasena').notEmpty().withMessage('Escribe tu contraseña'),
  validar,
  async (req, res) => {
    res.json(await authServicio.iniciarSesion(req.body.correo, req.body.contrasena));
  }
);

// GET /api/auth/perfil (HU-02) · Pide sesión
// verificarToken deja en req.usuario el { id, rol } que venía en el token.
router.get('/perfil', verificarToken, async (req, res) => {
  res.json(await authServicio.obtenerPerfil(req.usuario.id));
});

module.exports = router;
