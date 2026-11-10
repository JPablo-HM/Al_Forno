// CAPA ACCESO A DATOS (repositorio) del módulo Ubicación (HU-01 Registro).
// Es la única capa que habla con MySQL: solo llama procedimientos almacenados.
//
// resultados[0] = las filas del SELECT del procedimiento: [{ id, nombre }].
const pool = require('../../config/db');

// Todos los países → sp_ListarPaises()
async function listarPaises() {
  const [resultados] = await pool.query('CALL sp_ListarPaises()');
  return resultados[0];
}

// Las provincias de UN país → sp_ListarProvincias(pais_id)
async function listarProvincias(paisId) {
  const [resultados] = await pool.query('CALL sp_ListarProvincias(?)', [paisId]);
  return resultados[0];
}

// Los cantones de UNA provincia → sp_ListarCantones(provincia_id)
async function listarCantones(provinciaId) {
  const [resultados] = await pool.query('CALL sp_ListarCantones(?)', [provinciaId]);
  return resultados[0];
}

module.exports = { listarPaises, listarProvincias, listarCantones };
