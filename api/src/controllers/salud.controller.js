// CAPA API (controlador): recibe la petición y devuelve la respuesta.
// No tiene reglas de negocio: eso le toca al servicio.
const saludService = require('../services/salud.service');

// req = la petición (parámetros, cuerpo JSON, token); res = la respuesta.
// async/await: espera al servicio sin bloquear la API mientras tanto.
// Si el servicio lanza un error, Express 5 lo pasa solo al middleware de
// errores, por eso aquí no hace falta try/catch.
async function verificar(req, res) {
  const estado = await saludService.obtenerEstado();
  // Responde con código 200 y el objeto convertido a JSON.
  res.json(estado);
}

module.exports = { verificar };
