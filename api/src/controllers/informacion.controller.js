// CAPA API (controlador) del módulo Información (HU-04, 05, 06).
// Recibe la petición, llama al servicio y responde en JSON.
const informacionService = require('../services/informacion.service');

// GET /api/horario (HU-04)
async function obtenerHorario(req, res) {
  const horario = await informacionService.obtenerHorario();
  res.json(horario);
}

// GET /api/restaurante (HU-05)
async function obtenerRestaurante(req, res) {
  const restaurante = await informacionService.obtenerRestaurante();
  res.json(restaurante);
}

// GET /api/promociones (HU-06)
async function listarPromociones(req, res) {
  const promociones = await informacionService.listarPromociones();
  res.json(promociones);
}

module.exports = { obtenerHorario, obtenerRestaurante, listarPromociones };
