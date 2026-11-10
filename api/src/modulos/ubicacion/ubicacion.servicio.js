// CAPA LÓGICA DE NEGOCIO (servicio) del módulo Ubicación (HU-01 Registro).
// No hay reglas de negocio: solo pasa las listas de la base a la app.
// Si un país o una provincia no existe, la lista sale vacía ([]).
const ubicacionRepositorio = require('./ubicacion.repositorio');

async function listarPaises() {
  return ubicacionRepositorio.listarPaises();
}

async function listarProvincias(paisId) {
  return ubicacionRepositorio.listarProvincias(paisId);
}

async function listarCantones(provinciaId) {
  return ubicacionRepositorio.listarCantones(provinciaId);
}

module.exports = { listarPaises, listarProvincias, listarCantones };
