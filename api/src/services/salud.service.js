// CAPA LÓGICA DE NEGOCIO (servicio): decide qué hacer y arma el resultado.
const saludRepository = require('../repositories/salud.repository');
const { ahora } = require('../utils/tiempo');

async function obtenerEstado() {
  let baseDeDatos = 'conectada';
  try {
    await saludRepository.probarConexion();
  } catch (error) {
    baseDeDatos = 'sin conexión: ' + error.message;
  }

  return {
    api: 'funcionando',
    baseDeDatos,
    horaCostaRica: ahora().format('YYYY-MM-DD HH:mm:ss'),
  };
}

module.exports = { obtenerEstado };
