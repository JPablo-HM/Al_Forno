// CAPA LÓGICA DE NEGOCIO (servicio) del módulo Perfil
// (HU-02, HU-20, HU-21, HU-23). Todo pide sesión: el id sale del token.
//
// Este módulo no tiene repositorio propio: usa el de la cuenta
// (auth/auth.repositorio.js), que ya tiene todas las llamadas a MySQL.
const { generateSecret } = require('otplib');
const authRepositorio = require('../auth/auth.repositorio');
const seguridad = require('../auth/seguridad.servicio');
const { cifrar, descifrar } = require('../../utils/cifrado');
const correo = require('../../utils/correo');
const { EMISOR_AUTENTICADOR } = require('../../config/seguridad');

const { errorCon } = require('../../utils/errores');

async function obtenerUsuarioOFallar(id) {
  const usuario = await authRepositorio.obtenerUsuario(id);
  if (!usuario) throw errorCon(404, 'El usuario no existe');
  return usuario;
}

// HU-02 / HU-23 · Perfil completo. La cédula y el teléfono están cifrados
// en la base: aquí se descifran para mostrarlos SOLO a su dueño.
async function obtenerPerfil(id) {
  const u = await obtenerUsuarioOFallar(id);
  return {
    id: u.id,
    rol: u.rol,
    nombre_completo: u.nombre_completo,
    cedula: descifrar(u.cedula),
    telefono: descifrar(u.telefono),
    correo: u.correo,
    authenticator_activo: Boolean(u.authenticator_activo),
  };
}

// HU-20 · Cambiar la contraseña desde el perfil: pide la actual.
async function cambiarContrasena(id, actual, nueva, req) {
  const { correo: correoUsuario } = await obtenerUsuarioOFallar(id);
  const usuario = await authRepositorio.obtenerUsuarioPorCorreo(correoUsuario);

  if (!(await seguridad.compararContrasena(actual, usuario.contrasena_hash))) {
    await seguridad.auditar(req, usuario, 'CAMBIO_CONTRASENA', 'FALLO');
    throw errorCon(401, 'La contraseña actual no es correcta');
  }

  await seguridad.guardarContrasenaNueva(usuario.id, nueva);
  await seguridad.auditar(req, usuario, 'CAMBIO_CONTRASENA', 'EXITO');
  await correo.avisarCambioContrasena(usuario.correo, usuario.nombre_completo)
    .catch((error) => console.error('No se pudo enviar el aviso:', error.message));
  return { mensaje: 'Tu contraseña se cambió' };
}

// ---------------------------------------------------------------------
// Google Authenticator (HU-21) · Vincular SIN código QR
//   1. iniciarVinculacion: crea la clave secreta, la guarda CIFRADA (sin
//      activar) y la devuelve para el botón "Copiar".
//   2. El cliente la pega en Google Authenticator ("Ingresar una clave de
//      configuración") y escribe el primer código que le muestra.
//   3. confirmarVinculacion: si el código es correcto, queda activo.
// ---------------------------------------------------------------------

async function iniciarVinculacion(id) {
  const usuario = await obtenerUsuarioOFallar(id);
  if (usuario.authenticator_activo) {
    throw errorCon(409, 'Ya tienes Google Authenticator vinculado');
  }
  // 32 caracteres en base32 (letras A-Z y números 2-7), el formato que
  // entiende Google Authenticator.
  const clave = generateSecret();
  await authRepositorio.guardarAutenticador(id, cifrar(clave));
  return {
    clave,                                              // para "Copiar"
    clave_formateada: clave.match(/.{1,4}/g).join(' '), // "ABCD EFGH ..." para leerla
    cuenta: usuario.correo,                             // nombre de la cuenta en la app
    emisor: EMISOR_AUTENTICADOR,
  };
}

async function confirmarVinculacion(id, codigo) {
  const datos = await authRepositorio.obtenerAutenticador(id);
  if (!datos?.authenticator_secreto) {
    throw errorCon(409, 'Primero genera la clave');
  }
  if (!seguridad.codigoAutenticadorValido(descifrar(datos.authenticator_secreto), codigo)) {
    throw errorCon(401, 'El código no coincide. Revisa que copiaste bien la clave y escribe el código actual');
  }
  await authRepositorio.activarAutenticador(id);
  return { mensaje: 'Google Authenticator quedó vinculado', authenticator_activo: true };
}

// Desvincular: se confirma con un código actual de Google Authenticator.
async function desvincular(id, codigo) {
  if (!(await seguridad.validarCodigoAutenticador(id, codigo))) {
    throw errorCon(401, 'Código incorrecto');
  }
  await authRepositorio.desvincularAutenticador(id);
  return { mensaje: 'Google Authenticator se desvinculó', authenticator_activo: false };
}

module.exports = { obtenerPerfil, cambiarContrasena, iniciarVinculacion, confirmarVinculacion, desvincular };
