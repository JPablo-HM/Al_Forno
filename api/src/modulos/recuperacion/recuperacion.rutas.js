// CAPA API (rutas) del módulo Recuperación de contraseña (HU-22).
// Todas son públicas (el cliente no puede entrar); los pasos 2 y 3
// piden el pase temporal que entrega el paso anterior.
const { Router } = require('express');
const { body } = require('express-validator');
const recuperacionServicio = require('./recuperacion.servicio');
const validar = require('../../middlewares/validar');
const { verificarPase } = require('../../middlewares/autenticacion');
const { contrasenaSegura, confirmacionIgual } = require('../../middlewares/reglasCuenta');

const router = Router();

// Este router se monta en '/api/recuperacion' (ver modulos/index.js).

// POST /api/recuperacion/inicio · Paso 1 · Cuerpo: { correo }
// Responde { pase, metodos: ['PREGUNTAS', 'AUTENTICADOR'?], preguntas: [{ pregunta_id, texto }] }
router.post(
  '/inicio',
  body('correo').trim().toLowerCase().isEmail().withMessage('Escribe un correo válido'),
  validar,
  async (req, res) => {
    res.json(await recuperacionServicio.iniciar(req.body.correo));
  }
);

// POST /api/recuperacion/verificar · Paso 2 · Pide el pase RECUPERAR
// Cuerpo: { metodo: 'PREGUNTAS', respuestas: [{ pregunta_id, respuesta }, ×3] }
//      o  { metodo: 'AUTENTICADOR', codigo }
// Responde { pase } para el paso 3.
router.post(
  '/verificar',
  verificarPase('RECUPERAR'),
  body('metodo').isIn(['PREGUNTAS', 'AUTENTICADOR']).withMessage('Elige cómo comprobar que eres vos'),
  // Solo se revisa lo que corresponde al método elegido
  body('respuestas').if(body('metodo').equals('PREGUNTAS'))
    .isArray({ min: 3, max: 3 }).withMessage('Responde las 3 preguntas'),
  body('respuestas.*.respuesta').if(body('metodo').equals('PREGUNTAS'))
    .isString().notEmpty().withMessage('Responde las 3 preguntas'),
  body('codigo').if(body('metodo').equals('AUTENTICADOR'))
    .trim().matches(/^\d{6}$/).withMessage('El código tiene 6 dígitos'),
  validar,
  async (req, res) => {
    res.json(await recuperacionServicio.verificar(req.usuario, req.body, req));
  }
);

// POST /api/recuperacion/nueva · Paso 3 · Pide el pase NUEVA_CONTRASENA
// Cuerpo: { contrasena, confirmacion }
router.post(
  '/nueva',
  verificarPase('NUEVA_CONTRASENA'),
  contrasenaSegura('contrasena'),
  confirmacionIgual('confirmacion', 'contrasena'),
  validar,
  async (req, res) => {
    res.json(await recuperacionServicio.guardarNueva(req.usuario, req.body.contrasena, req));
  }
);

module.exports = router;
