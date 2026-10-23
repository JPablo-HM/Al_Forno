// =====================================================================
// Reglas de validación (express-validator) que se repiten en varias
// rutas de la cuenta: la contraseña nueva, su confirmación y los códigos.
// Se escriben una sola vez aquí y las rutas las reutilizan.
// =====================================================================
const { body } = require('express-validator');
const { reglasIncumplidas, LARGO_MAXIMO_CONTRASENA } = require('../config/seguridad');

// HU-20 · La contraseña cumple la política. La app ya la revisó, pero
// la API la revisa OTRA VEZ: nunca se confía solo en la app.
// Si falla, el mensaje dice qué le falta: "Le falta: Un número, Un símbolo".
function contrasenaSegura(campo = 'contrasena') {
  return body(campo)
    .isString().withMessage('Escribe una contraseña')
    .isLength({ max: LARGO_MAXIMO_CONTRASENA }).withMessage(`La contraseña puede tener máximo ${LARGO_MAXIMO_CONTRASENA} caracteres`)
    .custom((valor) => {
      const faltan = reglasIncumplidas(valor);
      if (faltan.length) throw new Error(`La contraseña no es segura. Le falta: ${faltan.join(', ')}`);
      return true;
    });
}

// HU-01 / HU-20 · La contraseña se escribe dos veces y deben coincidir.
function confirmacionIgual(campoConfirmacion = 'confirmacion', campo = 'contrasena') {
  return body(campoConfirmacion).custom((valor, { req }) => {
    if (valor !== req.body[campo]) throw new Error('Las contraseñas no coinciden');
    return true;
  });
}

// HU-21 · Código de 6 dígitos (del correo o de Google Authenticator)
function codigoSeisDigitos(campo = 'codigo') {
  return body(campo).trim().matches(/^\d{6}$/).withMessage('El código tiene 6 dígitos');
}

module.exports = { contrasenaSegura, confirmacionIgual, codigoSeisDigitos };
