// CAPA API (controlador): recibe la petición y devuelve la respuesta.
// No tiene reglas de negocio: eso le toca al servicio.
const saludService = require('../services/salud.service');

async function verificar(req, res) {
  const estado = await saludService.obtenerEstado();
  res.json(estado);
}

module.exports = { verificar };
