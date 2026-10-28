// CAPA API (rutas) del módulo Cuenta: registro, verificación del correo e
// inicio de sesión en 2 pasos (HU-01, HU-02, HU-14, HU-20, HU-21).
// Cada ruta: primero las validaciones de los datos (express-validator),
// luego validar (responde 400 si algo está mal) y al final el servicio.
const { Router } = require('express');
const { body } = require('express-validator');
const authServicio = require('./auth.servicio');
const validar = require('../../middlewares/validar');
const { verificarPase } = require('../../middlewares/autenticacion');
const { contrasenaSegura, confirmacionIgual, codigoSeisDigitos } = require('../../middlewares/reglasCuenta');

const router = Router();

// Este router se monta en '/api/auth' (ver modulos/index.js).

// GET /api/auth/preguntas (HU-01) · Público · Lista para elegir 3
router.get('/preguntas', async (req, res) => {
  res.json(await authServicio.listarPreguntas());
});

// POST /api/auth/registro (HU-01) · Público
// Cuerpo: { nombre_completo, cedula, telefono, correo, contrasena, confirmacion,
//           respuestas: [{ pregunta_id, respuesta }, ×3] }
// trim() quita espacios al inicio y al final antes de validar.
router.post(
  '/registro',
  body('nombre_completo').trim().notEmpty().withMessage('Escribe tu nombre completo')
    .isLength({ max: 100 }).withMessage('El nombre es muy largo'),
  body('cedula').trim().matches(/^\d{9}$/).withMessage('La cédula debe tener 9 dígitos'),
  body('telefono').trim().matches(/^\d{8}$/).withMessage('El teléfono debe tener 8 dígitos'),
  body('correo').trim().toLowerCase().isEmail().withMessage('Escribe un correo válido')
    .isLength({ max: 254 }).withMessage('El correo es muy largo'),
  contrasenaSegura('contrasena'),
  confirmacionIgual('confirmacion', 'contrasena'),
  // HU-01: 3 preguntas distintas, cada una con su respuesta
  body('respuestas').isArray({ min: 3, max: 3 }).withMessage('Responde 3 preguntas de seguridad')
    .custom((respuestas) => {
      const ids = respuestas.map((r) => Number(r?.pregunta_id));
      if (new Set(ids).size !== 3) throw new Error('Elige 3 preguntas distintas');
      return true;
    }),
  body('respuestas.*.pregunta_id').isInt({ min: 1 }).withMessage('Pregunta inválida'),
  body('respuestas.*.respuesta').isString().trim().notEmpty().withMessage('Responde las 3 preguntas')
    .isLength({ max: 100 }).withMessage('La respuesta es muy larga'),
  validar,
  async (req, res) => {
    // 201 = "creado"
    res.status(201).json(await authServicio.registrar(req.body, req));
  }
);

// GET /api/auth/verificar?token=... (HU-01) · Público
// Es el link del correo "¿Eres vos?". Se abre en el navegador del celular,
// por eso responde una página HTML sencilla en lugar de JSON.
router.get(
  '/verificar',
  async (req, res) => {
    // El token del link son 64 caracteres hexadecimales; si no, ni se busca.
    const token = String(req.query.token || '');
    const activada = /^[0-9a-f]{64}$/.test(token) && (await authServicio.verificarCorreo(token));
    const [titulo, texto] = activada
      ? ['Tu cuenta fue verificada', 'Ya puedes volver a la app e iniciar sesión.']
      : ['El link no es válido', 'Venció o ya se usó. Desde la app, en Iniciar sesión, puedes pedir un correo nuevo.'];
    res.status(activada ? 200 : 400).type('html').send(`<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>AL FORNO</title></head>
<body style="font-family:Arial,sans-serif;background:#f4ece0;color:#2b2420;text-align:center;padding:48px 16px">
  <h1 style="color:#b0512f">AL FORNO</h1>
  <h2>${titulo}</h2>
  <p>${texto}</p>
</body></html>`);
  }
);

// POST /api/auth/reenviar-verificacion (HU-01) · Público · Cuerpo: { correo }
router.post(
  '/reenviar-verificacion',
  body('correo').trim().toLowerCase().isEmail().withMessage('Escribe un correo válido'),
  validar,
  async (req, res) => {
    res.json(await authServicio.reenviarVerificacion(req.body.correo));
  }
);

// POST /api/auth/login (HU-02, HU-14) · Público · Paso 1
// Cuerpo: { correo, contrasena }
// Responde { paso: 'DOBLE_FACTOR', pase, metodos } (cliente)
//       o  { paso: 'LISTO', usuario, token } (administrador)
router.post(
  '/login',
  body('correo').trim().toLowerCase().notEmpty().withMessage('Escribe tu correo'),
  body('contrasena').isString().notEmpty().withMessage('Escribe tu contraseña'),
  validar,
  async (req, res) => {
    res.json(await authServicio.iniciarSesion(req.body.correo, req.body.contrasena, req));
  }
);

// POST /api/auth/login/enviar-codigo (HU-21) · Pide el pase DOBLE_FACTOR
// Envía el código de 6 dígitos al correo.
router.post('/login/enviar-codigo', verificarPase('DOBLE_FACTOR'), async (req, res) => {
  res.json(await authServicio.enviarCodigoLogin(req.usuario));
});

// POST /api/auth/login/verificar (HU-21) · Pide el pase DOBLE_FACTOR · Paso 2
// Cuerpo: { metodo: 'CORREO' | 'AUTENTICADOR', codigo }
// Responde { paso: 'LISTO', usuario, token }
//       o  { paso: 'CAMBIAR_CONTRASENA', pase } si la contraseña venció (HU-20)
router.post(
  '/login/verificar',
  verificarPase('DOBLE_FACTOR'),
  body('metodo').isIn(['CORREO', 'AUTENTICADOR']).withMessage('Elige cómo verificar'),
  codigoSeisDigitos('codigo'),
  validar,
  async (req, res) => {
    res.json(await authServicio.verificarCodigoLogin(req.usuario, req.body.metodo, req.body.codigo, req));
  }
);

// POST /api/auth/login/cambiar-contrasena (HU-20) · Pide el pase CAMBIAR_CONTRASENA
// Cuerpo: { contrasena, confirmacion } · Responde { paso: 'LISTO', usuario, token }
router.post(
  '/login/cambiar-contrasena',
  verificarPase('CAMBIAR_CONTRASENA'),
  contrasenaSegura('contrasena'),
  confirmacionIgual('confirmacion', 'contrasena'),
  validar,
  async (req, res) => {
    res.json(await authServicio.cambiarContrasenaVencida(req.usuario, req.body.contrasena, req));
  }
);

module.exports = router;
