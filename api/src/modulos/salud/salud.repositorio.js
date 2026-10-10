// CAPA ACCESO A DATOS (repositorio) del módulo Salud: la única que habla con MySQL.
// Los demás repositorios llamarán procedimientos almacenados: CALL sp_...
const pool = require('../../config/db');

// SELECT 1 es la consulta más simple posible: solo comprueba que MySQL
// responde. Los próximos repositorios llamarán procedimientos con
// parámetros (los ? evitan la inyección SQL), por ejemplo:
//   const [resultado] = await pool.query('CALL sp_ObtenerPedido(?, ?)', [id, clienteId]);
async function probarConexion() {
  await pool.query('SELECT 1');
}

module.exports = { probarConexion };
