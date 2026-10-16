// =====================================================================
// Revisa el resultado de las validaciones de express-validator.
//
// En las rutas se escriben las reglas de cada campo, por ejemplo:
//   body('cedula').matches(/^\d{9}$/).withMessage('La cédula debe tener 9 dígitos')
// y al final de la lista se pone este middleware. Si algún campo no cumple,
// responde 400 con el primer mensaje y la petición no llega al servicio.
// =====================================================================
const { validationResult } = require('express-validator');

function validar(req, res, next) {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    const primero = errores.array()[0];
    // campo: para que la app marque cuál campo está mal
    return res.status(400).json({ mensaje: primero.msg, campo: primero.path });
  }
  next(); // todo bien: sigue a la ruta
}

module.exports = validar;
