// =====================================================================
// CAPA LÓGICA DE NEGOCIO · Reglas de seguridad COMPARTIDAS por los tres
// módulos de la cuenta: auth (registro y login), recuperacion (HU-22) y
// perfil. Cada regla se escribe una sola vez aquí.
//
//   · Sesión y pase temporal (JWT)
//   · Bloqueo por intentos (HU-02)
//   · Contraseñas: hash, historial y vigencia (HU-20)
//   · Respuestas de seguridad (HU-01, HU-22)
//   · Código de Google Authenticator (HU-21)
//   · Auditoría (HU-24)
// Los números (3 intentos, 90 días...) están en config/seguridad.js.
// =====================================================================
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { verifySync } = require('otplib');
const authRepositorio = require('./auth.repositorio');
const { descifrar } = require('../../utils/cifrado');
const { ahora, segundosDesde } = require('../../utils/tiempo');
const {
  MAX_INTENTOS, MINUTOS_BLOQUEO, DIAS_VIGENCIA, HISTORIAL_CONTRASENAS,
  TOLERANCIA_AUTENTICADOR_SEG, MINUTOS_PASE,
} = require('../../config/seguridad');

const { errorCon } = require('../../utils/errores');

const RONDAS_BCRYPT = 10; // cuántas veces se mezcla: más = más lento de adivinar

// ---------------------------------------------------------------------
// Sesión y pase temporal
// ---------------------------------------------------------------------

// SESIÓN: lo mínimo para saber quién es (id y rol), firmado con JWT_SECRET.
function crearSesion(usuario) {
  return jwt.sign({ id: usuario.id, rol: usuario.rol }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });
}

// PASE TEMPORAL: un token que solo sirve para UN paso siguiente y vence
// en 10 minutos. Lleva "proposito" para que no se pueda usar en otro paso
// ni como sesión (ver middlewares/autenticacion.js).
//   DOBLE_FACTOR       → escribir el código después de la contraseña
//   CAMBIAR_CONTRASENA → la contraseña venció (HU-20)
//   RECUPERAR          → responder preguntas o código (HU-22)
//   NUEVA_CONTRASENA   → crear la contraseña nueva (HU-22)
function crearPase(usuario, proposito) {
  return jwt.sign({ id: usuario.id, correo: usuario.correo, proposito }, process.env.JWT_SECRET, {
    expiresIn: `${MINUTOS_PASE}m`,
  });
}

// Lo que la app recibe del usuario: nunca la contraseña ni el hash.
function datosPublicos(u) {
  return { id: u.id, rol: u.rol, nombre_completo: u.nombre_completo, correo: u.correo };
}

// ---------------------------------------------------------------------
// Bloqueo por intentos (HU-02)
// ---------------------------------------------------------------------

// Segundos que faltan del bloqueo (0 = no está bloqueado).
function segundosDeBloqueo(usuario) {
  if (!usuario.bloqueado_hasta) return 0;
  return Math.max(0, -segundosDesde(usuario.bloqueado_hasta));
}

// Si la cuenta está bloqueada, responde 423 con los segundos que faltan.
// HU-02: "mientras está bloqueada no se acepta ningún intento, aunque la
// contraseña sea correcta".
function revisarBloqueo(usuario) {
  const segundos = segundosDeBloqueo(usuario);
  if (segundos > 0) {
    throw errorCon(423, `Cuenta bloqueada. Intenta de nuevo en ${segundos} segundos`, { segundos });
  }
}

// Suma un intento fallido (contraseña, código o respuestas).
// Al llegar a MAX_INTENTOS: bloquea MINUTOS_BLOQUEO, el contador vuelve a
// cero y queda BLOQUEO en la auditoría. Devuelve true si quedó bloqueada.
async function registrarFallo(usuario, req) {
  // Si un bloqueo anterior ya terminó, se empieza a contar de nuevo.
  const previos = usuario.bloqueado_hasta && segundosDeBloqueo(usuario) === 0 ? 0 : usuario.intentos_fallidos;
  const intentos = previos + 1;

  if (intentos >= MAX_INTENTOS) {
    const hasta = ahora().add(MINUTOS_BLOQUEO, 'minute').format('YYYY-MM-DD HH:mm:ss');
    await authRepositorio.actualizarIntentos(usuario.id, 0, hasta);
    await auditar(req, usuario, 'BLOQUEO', 'EXITO');
    return true;
  }
  await authRepositorio.actualizarIntentos(usuario.id, intentos, null);
  return false;
}

// Lanza el error que corresponde después de un fallo: si con este fallo
// quedó bloqueada, avisa del bloqueo; si no, el mensaje normal.
function errorDeFallo(quedoBloqueada, status, mensaje) {
  if (quedoBloqueada) {
    const segundos = MINUTOS_BLOQUEO * 60;
    return errorCon(423, `Demasiados intentos. Cuenta bloqueada por ${segundos} segundos`, { segundos });
  }
  return errorCon(status, mensaje);
}

// HU-02: "cuando el cliente inicia sesión con éxito, el contador vuelve a cero"
async function reiniciarIntentos(usuario) {
  if (usuario.intentos_fallidos > 0 || usuario.bloqueado_hasta) {
    await authRepositorio.actualizarIntentos(usuario.id, 0, null);
  }
}

// ---------------------------------------------------------------------
// Contraseñas (HU-20)
// ---------------------------------------------------------------------

function hashContrasena(contrasena) {
  return bcrypt.hash(contrasena, RONDAS_BCRYPT);
}

// bcrypt.compare cifra lo que se escribió y lo compara con el hash guardado.
function compararContrasena(contrasena, hash) {
  return bcrypt.compare(contrasena, hash);
}

// HU-20: la contraseña vence DIAS_VIGENCIA días después del último cambio.
function contrasenaVencida(usuario) {
  return segundosDesde(usuario.contrasena_fecha) > DIAS_VIGENCIA * 24 * 60 * 60;
}

// HU-20: no se puede usar ninguna de las últimas 5 contraseñas.
// Se compara con bcrypt una por una (cada hash tiene su propia "sal").
async function revisarHistorial(usuarioId, contrasenaNueva) {
  const anteriores = await authRepositorio.listarHistorialContrasenas(usuarioId, HISTORIAL_CONTRASENAS);
  for (const hash of anteriores) {
    if (await bcrypt.compare(contrasenaNueva, hash)) {
      throw errorCon(409, 'Ya usaste esta contraseña antes. Elegí una que no sea ninguna de las últimas 5');
    }
  }
}

// Cambio completo: revisa el historial, guarda (transacción en la base:
// usuario + historial) y quita el bloqueo.
async function guardarContrasenaNueva(usuarioId, contrasenaNueva) {
  await revisarHistorial(usuarioId, contrasenaNueva);
  await authRepositorio.cambiarContrasena(usuarioId, await hashContrasena(contrasenaNueva));
}

// ---------------------------------------------------------------------
// Respuestas de seguridad (HU-01, HU-22)
// HU-22: "no se distinguen mayúsculas ni espacios al inicio o al final".
// Por eso se normalizan ANTES del hash, al guardar y al comparar.
// ---------------------------------------------------------------------

function normalizarRespuesta(respuesta) {
  return String(respuesta).trim().toLowerCase();
}

function hashRespuesta(respuesta) {
  return bcrypt.hash(normalizarRespuesta(respuesta), RONDAS_BCRYPT);
}

// guardadas: [{ pregunta_id, respuesta_hash }] · escritas: [{ pregunta_id, respuesta }]
// true solo si las 3 coinciden.
async function respuestasCorrectas(guardadas, escritas) {
  if (escritas.length !== guardadas.length) return false;
  for (const guardada of guardadas) {
    const escrita = escritas.find((e) => Number(e.pregunta_id) === guardada.pregunta_id);
    if (!escrita) return false;
    if (!(await bcrypt.compare(normalizarRespuesta(escrita.respuesta), guardada.respuesta_hash))) return false;
  }
  return true;
}

// ---------------------------------------------------------------------
// Google Authenticator (HU-21)
// La clave está cifrada en la base: se descifra y otplib calcula el
// código que corresponde a esta hora. Si coincide con el escrito, sirve.
// ---------------------------------------------------------------------

function codigoAutenticadorValido(secreto, codigo) {
  if (!secreto) return false;
  const { valid } = verifySync({ secret: secreto, token: String(codigo), epochTolerance: TOLERANCIA_AUTENTICADOR_SEG });
  return valid;
}

// Solo si el cliente ya lo vinculó (authenticator_activo).
async function validarCodigoAutenticador(usuarioId, codigo) {
  const datos = await authRepositorio.obtenerAutenticador(usuarioId);
  if (!datos?.authenticator_activo) return false;
  return codigoAutenticadorValido(descifrar(datos.authenticator_secreto), codigo);
}

// ---------------------------------------------------------------------
// Auditoría (HU-24)
// Guarda quién, qué actividad y el resultado. La fecha y la hora las pone
// MySQL. Se guardan la IP y el dispositivo ("User-Agent") de la petición.
// Nunca se guardan contraseñas, respuestas ni códigos.
// ---------------------------------------------------------------------

async function auditar(req, usuario, actividad, resultado, correoEscrito) {
  await authRepositorio.registrarAuditoria({
    usuario_id: usuario?.id ?? null,
    correo: usuario?.correo ?? correoEscrito ?? '',
    actividad,
    resultado,
    ip: req.ip,
    dispositivo: (req.get('user-agent') || '').slice(0, 200) || null,
  });
}

module.exports = {
  crearSesion,
  crearPase,
  datosPublicos,
  revisarBloqueo,
  registrarFallo,
  errorDeFallo,
  reiniciarIntentos,
  hashContrasena,
  compararContrasena,
  contrasenaVencida,
  guardarContrasenaNueva,
  hashRespuesta,
  respuestasCorrectas,
  codigoAutenticadorValido,
  validarCodigoAutenticador,
  auditar,
};
