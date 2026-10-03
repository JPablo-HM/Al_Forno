// Manejo central de errores: el cliente recibe mensajes claros,
// nunca detalles internos de la base de datos.
function noEncontrado(req, res) {
  res.status(404).json({ mensaje: 'Ruta no encontrada' });
}

// eslint-disable-next-line no-unused-vars
function manejarErrores(err, req, res, next) {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    mensaje: status === 500 ? 'Error interno del servidor' : err.message,
  });
}

module.exports = { noEncontrado, manejarErrores };
