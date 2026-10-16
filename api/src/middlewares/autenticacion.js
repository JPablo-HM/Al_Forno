// =====================================================================
// Autenticación con token JWT.
//
// Al iniciar sesión la API entrega un token firmado con JWT_SECRET (.env).
// La app lo manda en cada petición protegida, en el encabezado:
//   Authorization: Bearer <token>
//
// verificarToken comprueba que el token exista, que la firma sea válida y
// que no haya vencido. Si todo está bien, guarda en req.usuario los datos
// que van dentro del token ({ id, rol }) para que la ruta sepa QUIÉN pide.
// =====================================================================
const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
  const encabezado = req.headers.authorization || '';
  // 'Bearer abc.def.ghi' → ['Bearer', 'abc.def.ghi']
  const [tipo, token] = encabezado.split(' ');

  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({ mensaje: 'Debes iniciar sesión' });
  }

  try {
    // Si la firma no coincide o el token venció, jwt.verify lanza un error.
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ mensaje: 'Tu sesión venció. Inicia sesión de nuevo' });
  }
}

// Solo deja pasar a los usuarios con ese rol. Se usa DESPUÉS de verificarToken.
// Ej.: router.get('/pedidos', verificarToken, soloRol('CLIENTE'), ...)
function soloRol(rol) {
  return (req, res, next) => {
    if (req.usuario?.rol !== rol) {
      return res.status(403).json({ mensaje: 'No tienes permiso para esta acción' });
    }
    next();
  };
}

module.exports = { verificarToken, soloRol };
