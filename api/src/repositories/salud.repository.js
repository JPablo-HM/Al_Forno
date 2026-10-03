// CAPA ACCESO A DATOS (repositorio): la única que habla con MySQL.
// Los demás repositorios llamarán procedimientos almacenados: CALL sp_...
const pool = require('../config/db');

async function probarConexion() {
  await pool.query('SELECT 1');
}

module.exports = { probarConexion };
