// CAPA API (rutas) del módulo Agenda (HU-12).
// Define el endpoint y lo que hace al recibir la petición: llama al
// servicio y responde en JSON. Es pública: la agenda se ve sin iniciar
// sesión, por eso no pide token.
const { Router } = require('express');
const agendaServicio = require('./agenda.servicio');

const router = Router();

// Este router se monta en '/api/agenda' (ver modulos/index.js), así que
// '/' queda como GET /api/agenda.
// Los eventos los da el socio Cartelera de eventos: se espera con await.
router.get('/', async (req, res) => {
  res.json(await agendaServicio.listarAgenda());
});

module.exports = router;
