// =====================================================================
// errorCon: crea un error con su estado HTTP. middlewares/errores.js lo
// responde a la app con ese código y ese mensaje.
//   throw errorCon(404, 'El pedido no existe')
// datos (opcional): campos extra para la app, por ejemplo { segundos: 45 }
// cuando la cuenta está bloqueada (HU-02).
// =====================================================================
function errorCon(status, mensaje, datos) {
  const error = new Error(mensaje);
  error.status = status;
  if (datos) error.datos = datos;
  return error;
}

module.exports = { errorCon };
