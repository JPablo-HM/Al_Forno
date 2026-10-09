// CAPA ACCESO A DATOS (repositorio) del módulo Información (HU-04, 05, 06).
// Es la única capa que habla con MySQL: solo llama procedimientos almacenados.
const pool = require('../config/db');

// Cuando se ejecuta un CALL, mysql2 devuelve una lista de "resultados":
//   resultados[0] → las filas del SELECT del procedimiento
//   resultados[1] → información técnica de MySQL (no se usa)

// HU-04 · Horario → sp_ObtenerHorario()
// Devuelve las 7 filas (lunes a domingo).
async function obtenerHorario() {
  const [resultados] = await pool.query('CALL sp_ObtenerHorario()');
  return resultados[0];
}

// HU-05 · Ubicación y contacto → sp_ObtenerRestaurante()
// La tabla restaurante tiene una sola fila, por eso se toma la primera [0].
// Si no hay fila, devuelve null.
async function obtenerRestaurante() {
  const [resultados] = await pool.query('CALL sp_ObtenerRestaurante()');
  return resultados[0][0] || null;
}

// HU-06 · Promociones → sp_ListarPromocionesVigentes()
// El procedimiento ya filtra: solo activas y vigentes hoy (hora de Costa Rica).
// Puede devolver una lista vacía.
async function listarPromocionesVigentes() {
  const [resultados] = await pool.query('CALL sp_ListarPromocionesVigentes()');
  return resultados[0];
}

module.exports = { obtenerHorario, obtenerRestaurante, listarPromocionesVigentes };
