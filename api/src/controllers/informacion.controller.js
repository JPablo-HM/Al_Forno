// CAPA API (controlador) del módulo Información (HU-04, 05, 06).
// Recibe la petición, llama al servicio y responde en JSON.
// Horario y restaurante no usan la base de datos (no llevan async/await);
// promociones sí, por eso esa función es async.
const informacionService = require('../services/informacion.service');

// GET /api/horario (HU-04)
function obtenerHorario(req, res) {
  const horario = informacionService.obtenerHorario();
  res.json(horario);
}

// GET /api/restaurante (HU-05)
function obtenerRestaurante(req, res) {
  const restaurante = informacionService.obtenerRestaurante();
  res.json(restaurante);
}

// GET /api/promociones (HU-06)
async function listarPromociones(req, res) {
  const promociones = await informacionService.listarPromociones();
  res.json(promociones);
}

module.exports = { obtenerHorario, obtenerRestaurante, listarPromociones };
