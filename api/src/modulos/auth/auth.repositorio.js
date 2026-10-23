// CAPA ACCESO A DATOS (repositorio) de la CUENTA (HU-01, HU-02, HU-14,
// HU-20 a HU-24). Es la única capa que habla con MySQL: solo llama
// procedimientos almacenados.
//
// Lo usan los tres módulos de la cuenta: auth (registro y login),
// recuperacion (HU-22) y perfil. Por eso vive aquí y los otros dos lo
// importan, en lugar de repetir las mismas llamadas en tres archivos.
//
// resultados[0] = las filas del SELECT del procedimiento.
// Los datos sensibles llegan YA protegidos desde el servicio (HU-23).
const pool = require('../../config/db');

// ---------------------------------------------------------------------
// Usuario
// ---------------------------------------------------------------------

// HU-01 · Crea un CLIENTE PENDIENTE con sus 3 respuestas → sp_RegistrarUsuario
// respuestas: [{ pregunta_id, respuesta_hash }]. Si el correo o la cédula
// ya existen, el procedimiento lanza un error 409.
async function registrarUsuario(datos) {
  const [resultados] = await pool.query('CALL sp_RegistrarUsuario(?, ?, ?, ?, ?, ?, ?)', [
    datos.nombre_completo,
    datos.cedula_cifrada,
    datos.cedula_hash,
    datos.telefono_cifrado,
    datos.correo,
    datos.contrasena_hash,
    JSON.stringify(datos.respuestas),
  ]);
  return resultados[0][0];
}

// HU-02 / HU-14 · Todo lo necesario para iniciar sesión: hash de la
// contraseña, estado, intentos, bloqueo, fecha de la contraseña y si
// tiene Google Authenticator. undefined si el correo no existe.
async function obtenerUsuarioPorCorreo(correo) {
  const [resultados] = await pool.query('CALL sp_ObtenerUsuarioPorCorreo(?)', [correo]);
  return resultados[0][0];
}

// Perfil (sin contraseña). La cédula y el teléfono vienen cifrados.
async function obtenerUsuario(id) {
  const [resultados] = await pool.query('CALL sp_ObtenerUsuario(?)', [id]);
  return resultados[0][0];
}

// HU-01 · El cliente confirmó el link: la cuenta queda ACTIVA
async function activarUsuario(id) {
  await pool.query('CALL sp_ActivarUsuario(?)', [id]);
}

// HU-02 · Guarda los intentos fallidos y el bloqueo (null = sin bloqueo)
async function actualizarIntentos(id, intentos, bloqueadoHasta) {
  await pool.query('CALL sp_ActualizarIntentos(?, ?, ?)', [id, intentos, bloqueadoHasta]);
}

// ---------------------------------------------------------------------
// Códigos de un solo uso (link de verificación y código de 6 dígitos)
// ---------------------------------------------------------------------

// tipo: 'VERIFICACION' o 'DOBLE_FACTOR'. Los anteriores del mismo tipo
// dejan de servir.
async function guardarToken(usuarioId, tipo, tokenHash, minutos) {
  await pool.query('CALL sp_GuardarToken(?, ?, ?, ?)', [usuarioId, tipo, tokenHash, minutos]);
}

// Devuelve el usuario_id si el código sirve (y lo marca como usado), o
// undefined si no existe, ya se usó o venció.
// usuarioId: null para el link de verificación.
async function usarToken(usuarioId, tipo, tokenHash) {
  const [resultados] = await pool.query('CALL sp_UsarToken(?, ?, ?)', [usuarioId, tipo, tokenHash]);
  return resultados[0][0]?.usuario_id;
}

// ---------------------------------------------------------------------
// Preguntas de seguridad (HU-01, HU-22)
// ---------------------------------------------------------------------

async function listarPreguntas() {
  const [resultados] = await pool.query('CALL sp_ListarPreguntas()');
  return resultados[0];
}

// [{ pregunta_id, texto, respuesta_hash }]
async function obtenerPreguntasUsuario(usuarioId) {
  const [resultados] = await pool.query('CALL sp_ObtenerPreguntasUsuario(?)', [usuarioId]);
  return resultados[0];
}

// ---------------------------------------------------------------------
// Contraseñas (HU-20, HU-22)
// ---------------------------------------------------------------------

// Hashes de las últimas `cantidad` contraseñas, de la más nueva a la más vieja
async function listarHistorialContrasenas(usuarioId, cantidad) {
  const [resultados] = await pool.query('CALL sp_ListarHistorialContrasenas(?, ?)', [usuarioId, cantidad]);
  return resultados[0].map((fila) => fila.contrasena_hash);
}

// Transacción: cambia la contraseña, la agrega al historial, reinicia la
// fecha (90 días) y quita el bloqueo.
async function cambiarContrasena(usuarioId, contrasenaHash) {
  await pool.query('CALL sp_CambiarContrasena(?, ?)', [usuarioId, contrasenaHash]);
}

// ---------------------------------------------------------------------
// Google Authenticator (HU-21, HU-22)
// ---------------------------------------------------------------------

async function guardarAutenticador(usuarioId, secretoCifrado) {
  await pool.query('CALL sp_GuardarAuthenticator(?, ?)', [usuarioId, secretoCifrado]);
}

async function activarAutenticador(usuarioId) {
  await pool.query('CALL sp_ActivarAuthenticator(?)', [usuarioId]);
}

async function desvincularAutenticador(usuarioId) {
  await pool.query('CALL sp_DesvincularAuthenticator(?)', [usuarioId]);
}

// { authenticator_secreto (cifrado), authenticator_activo }
async function obtenerAutenticador(usuarioId) {
  const [resultados] = await pool.query('CALL sp_ObtenerAuthenticator(?)', [usuarioId]);
  return resultados[0][0];
}

// ---------------------------------------------------------------------
// Auditoría (HU-24)
// ---------------------------------------------------------------------

// actividad: REGISTRO, LOGIN_EXITOSO, LOGIN_FALLIDO, BLOQUEO,
//            CAMBIO_CONTRASENA, RECUPERACION · resultado: EXITO o FALLO
async function registrarAuditoria({ usuario_id, correo, actividad, resultado, ip, dispositivo }) {
  await pool.query('CALL sp_RegistrarAuditoria(?, ?, ?, ?, ?, ?)', [
    usuario_id ?? null, correo, actividad, resultado, ip ?? null, dispositivo ?? null,
  ]);
}

module.exports = {
  registrarUsuario,
  obtenerUsuarioPorCorreo,
  obtenerUsuario,
  activarUsuario,
  actualizarIntentos,
  guardarToken,
  usarToken,
  listarPreguntas,
  obtenerPreguntasUsuario,
  listarHistorialContrasenas,
  cambiarContrasena,
  guardarAutenticador,
  activarAutenticador,
  desvincularAutenticador,
  obtenerAutenticador,
  registrarAuditoria,
};
