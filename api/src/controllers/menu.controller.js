// CAPA API (controlador) del módulo Menú (HU-03).
// Recibe la petición, llama al servicio y responde en JSON.
const menuService = require('../services/menu.service');

// GET /api/menu (HU-03)
async function obtenerMenu(req, res) {
  const menu = await menuService.obtenerMenu();
  res.json(menu);
}

module.exports = { obtenerMenu };
