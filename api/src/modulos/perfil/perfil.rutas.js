// CAPA API (rutas) del módulo Perfil (HU-02, HU-20, HU-21, HU-23).
// Todas piden sesión: verificarToken deja en req.usuario el { id, rol }
// del token, así cada usuario solo ve y cambia SU cuenta.
const { Router } = require('express');
const { body } = require('express-validator');
const perfilServicio = require('./perfil.servicio');
const validar = require('../../middlewares/validar');
const { verificarToken } = require('../../middlewares/autenticacion');
const { contrasenaSegura, confirmacionIgual, codigoSeisDigitos } = require('../../middlewares/reglasCuenta');

const router = Router();

// Este router se monta en '/api/perfil' (ver modulos/index.js).
router.use(verificarToken);

// GET /api/perfil · Datos del usuario (cédula y teléfono descifrados)
router.get('/', async (req, res) => {
  res.json(await perfilServicio.obtenerPerfil(req.usuario.id));
});

// PUT /api/perfil/contrasena (HU-20) · Cuerpo: { actual, contrasena, confirmacion }
router.put(
  '/contrasena',
  body('actual').isString().notEmpty().withMessage('Escribe tu contraseña actual'),
  contrasenaSegura('contrasena'),
  confirmacionIgual('confirmacion', 'contrasena'),
  validar,
  async (req, res) => {
    res.json(await perfilServicio.cambiarContrasena(req.usuario.id, req.body.actual, req.body.contrasena, req));
  }
);

// POST /api/perfil/autenticador (HU-21) · Genera la clave para "Copiar"
router.post('/autenticador', async (req, res) => {
  res.json(await perfilServicio.iniciarVinculacion(req.usuario.id));
});

// POST /api/perfil/autenticador/confirmar (HU-21) · Cuerpo: { codigo }
router.post(
  '/autenticador/confirmar',
  codigoSeisDigitos('codigo'),
  validar,
  async (req, res) => {
    res.json(await perfilServicio.confirmarVinculacion(req.usuario.id, req.body.codigo));
  }
);

// DELETE /api/perfil/autenticador (HU-21) · Cuerpo: { codigo }
router.delete(
  '/autenticador',
  codigoSeisDigitos('codigo'),
  validar,
  async (req, res) => {
    res.json(await perfilServicio.desvincular(req.usuario.id, req.body.codigo));
  }
);

module.exports = router;
