// Manejo central de errores: el cliente recibe mensajes claros,
// nunca detalles internos de la base de datos.
function noEncontrado(req, res) {
  res.status(404).json({ mensaje: 'Ruta no encontrada' });
}

// eslint-disable-next-line no-unused-vars
function manejarErrores(err, req, res, next) {
  // Errores de negocio de los procedimientos almacenados.
  // Llegan con SQLSTATE '45000' y un código 5400, 5403, 5404 o 5409:
  // ese código menos 5000 es el estado HTTP (400, 403, 404 o 409) y el
  // mensaje ya viene escrito para mostrarlo al usuario.
  // Ejemplos: "Evento agotado" (409), "El pedido no existe" (404).
  if (err.sqlState === '45000' && err.errno >= 5400 && err.errno <= 5499) {
    return res.status(err.errno - 5000).json({ mensaje: err.sqlMessage });
  }

  // Cualquier otro error: se registra en la consola y el cliente recibe
  // un mensaje general, sin detalles internos.
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    mensaje: status === 500 ? 'Error interno del servidor' : err.message,
  });
}

module.exports = { noEncontrado, manejarErrores };
