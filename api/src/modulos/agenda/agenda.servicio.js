// CAPA LÓGICA DE NEGOCIO (servicio) del módulo Agenda (HU-12).
//
// Este módulo NO tiene repositorio: la agenda no está en la base de datos
// de AL FORNO. La lleva el socio comercial "Cartelera de eventos"
// (socios/cartelera, Python): la productora que organiza los artistas.
const socios = require('../../utils/socios');

// HU-12 · Agenda de actividades (solo informativa).
// Devuelve [{ id, dias, nombre, descripcion }] tal como la da la cartelera.
// Si la cartelera no responde, la app muestra el error (503).
async function listarAgenda() {
  return socios.listarEventos();
}

module.exports = { listarAgenda };
