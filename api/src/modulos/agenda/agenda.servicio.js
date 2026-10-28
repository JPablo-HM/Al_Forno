// CAPA LÓGICA DE NEGOCIO (servicio) del módulo Agenda (HU-12).
//
// Este módulo NO tiene repositorio: la agenda no está en la base de
// datos, sino en config/agenda.js (igual que el horario de Inicio).
const { AGENDA } = require('../../config/agenda');

// HU-12 · Agenda de actividades (solo informativa).
// Devuelve [{ id, dias, nombre, descripcion }] tal como está en config/agenda.js.
function listarAgenda() {
  return AGENDA;
}

module.exports = { listarAgenda };
