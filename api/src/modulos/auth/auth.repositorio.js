// CAPA ACCESO A DATOS (repositorio) del módulo Cuenta (HU-01, HU-02, HU-14).
// Es la única capa que habla con MySQL: solo llama procedimientos almacenados.
// resultados[0] = las filas del SELECT del procedimiento.
const pool = require('../../config/db');

// HU-01 · Crea un CLIENTE → sp_RegistrarUsuario
// Si el correo o la cédula ya existen, el procedimiento lanza un error 409
// que el middleware de errores convierte en el mensaje para la app.
async function registrarUsuario({ nombre_completo, cedula, telefono, correo }, contrasenaHash) {
  const [resultados] = await pool.query('CALL sp_RegistrarUsuario(?, ?, ?, ?, ?)', [
    nombre_completo, cedula, telefono, correo, contrasenaHash,
  ]);
  return resultados[0][0]; // el usuario nuevo (sin contraseña)
}

// HU-02 / HU-14 · Busca por correo para iniciar sesión → sp_ObtenerUsuarioPorCorreo
// Trae el hash de la contraseña para compararlo con bcrypt. undefined si no existe.
async function obtenerUsuarioPorCorreo(correo) {
  const [resultados] = await pool.query('CALL sp_ObtenerUsuarioPorCorreo(?)', [correo]);
  return resultados[0][0];
}

// HU-02 · Perfil (sin contraseña) → sp_ObtenerUsuario
async function obtenerUsuario(id) {
  const [resultados] = await pool.query('CALL sp_ObtenerUsuario(?)', [id]);
  return resultados[0][0];
}

module.exports = { registrarUsuario, obtenerUsuarioPorCorreo, obtenerUsuario };
