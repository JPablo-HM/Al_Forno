// CAPA LÓGICA DE NEGOCIO (servicio) del módulo Salud: decide qué hacer y arma el resultado.
const saludRepositorio = require('./salud.repositorio');
const { ahora } = require('../../utils/tiempo');

async function obtenerEstado() {
  // Aquí SÍ se usa try/catch: si MySQL no responde no es un error de la API,
  // es parte de la información que se quiere mostrar.
  let baseDeDatos = 'conectada';
  try {
    await saludRepositorio.probarConexion();
  } catch (error) {
    baseDeDatos = 'sin conexión: ' + error.message;
  }

  // Este objeto es lo que verá la app (o el navegador) en formato JSON.
  return {
    api: 'funcionando',
    baseDeDatos,
    horaCostaRica: ahora().format('YYYY-MM-DD HH:mm:ss'),
  };
}

module.exports = { obtenerEstado };
