// =====================================================================
// Autenticación con token JWT.
//
// La API entrega dos clases de token, los dos firmados con JWT_SECRET:
//
//   · SESIÓN ({ id, rol }): se entrega al terminar de iniciar sesión.
//     La app lo manda en cada petición protegida:
//       Authorization: Bearer <token>
//     Lo revisa verificarToken.
//
//   · PASE TEMPORAL ({ id, correo, proposito }): dura 10 minutos y solo
//     sirve para UN paso (escribir el código, cambiar la contraseña
//     vencida, recuperar la contraseña). Lo revisa verificarPase.
//     Un pase NUNCA se acepta como sesión: así nadie puede saltarse el
//     doble factor usando el pase que recibió después de la contraseña.
//
// Si todo está bien, guardan en req.usuario lo que va dentro del token
// para que la ruta sepa QUIÉN pide.
// =====================================================================
const jwt = require('jsonwebtoken');

// Saca el token del encabezado y revisa la firma y el vencimiento.
// Devuelve el contenido del token, o null si no sirve.
function leerToken(req) {
  const encabezado = req.headers.authorization || '';
  // 'Bearer abc.def.ghi' → ['Bearer', 'abc.def.ghi']
  const [tipo, token] = encabezado.split(' ');
  if (tipo !== 'Bearer' || !token) return null;
  try {
    // Si la firma no coincide o el token venció, jwt.verify lanza un error.
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

function verificarToken(req, res, next) {
  const datos = leerToken(req);
  // Sin token, token vencido o un PASE (tiene "proposito"): no es una sesión.
  if (!datos || datos.proposito) {
    return res.status(401).json({ mensaje: 'Debes iniciar sesión' });
  }
  req.usuario = datos;
  next();
}

// Solo deja pasar un pase temporal con ese propósito.
// Ej.: router.post('/login/verificar', verificarPase('DOBLE_FACTOR'), ...)
function verificarPase(proposito) {
  return (req, res, next) => {
    const datos = leerToken(req);
    if (!datos || datos.proposito !== proposito) {
      return res.status(401).json({ mensaje: 'El tiempo para este paso terminó. Empieza de nuevo' });
    }
    req.usuario = datos;
    next();
  };
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

module.exports = { verificarToken, verificarPase, soloRol };
