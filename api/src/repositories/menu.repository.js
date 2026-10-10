// CAPA ACCESO A DATOS (repositorio) del módulo Menú (HU-03).
// Es la única capa que habla con MySQL: solo llama procedimientos almacenados.
const pool = require('../config/db');

// HU-03 · Productos activos → sp_ListarMenu()
// Vienen ordenados por categoría (en el orden del ENUM: Pizzas, Cucina
// italiana, Coctelería, Cervezas) y luego por nombre.
// resultados[0] = las filas del SELECT del procedimiento.
async function listarMenu() {
  const [resultados] = await pool.query('CALL sp_ListarMenu()');
  return resultados[0];
}

module.exports = { listarMenu };
