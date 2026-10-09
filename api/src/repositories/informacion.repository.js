// CAPA ACCESO A DATOS (repositorio) del módulo Información (HU-04, 05, 06).
// Es la única capa que habla con MySQL: solo llama procedimientos almacenados.
//
// El horario (HU-04) y la ubicación (HU-05) NO pasan por aquí: no están en
// la base de datos, sino en config/restaurante.js. Solo las promociones
// se guardan en MySQL.
const pool = require('../config/db');

// Cuando se ejecuta un CALL, mysql2 devuelve una lista de "resultados":
//   resultados[0] → las filas del SELECT del procedimiento
//   resultados[1] → información técnica de MySQL (no se usa)

// HU-06 · Promociones activas → sp_ListarPromocionesActivas()
// Puede devolver una lista vacía.
async function listarPromocionesActivas() {
  const [resultados] = await pool.query('CALL sp_ListarPromocionesActivas()');
  return resultados[0];
}

module.exports = { listarPromocionesActivas };
