// CAPA LÓGICA DE NEGOCIO (servicio) del módulo Cuenta: registro,
// verificación del correo e inicio de sesión en 2 pasos.
// (HU-01, HU-02, HU-14, HU-20, HU-21, HU-23, HU-24)
//
// Las reglas compartidas (bloqueo, contraseñas, auditoría, pases) están
// en seguridad.servicio.js; los números, en config/seguridad.js.
//
// INICIO DE SESIÓN DEL CLIENTE (HU-02 + HU-21):
//   1. POST /login            correo + contraseña → pase DOBLE_FACTOR
//   2. POST /login/enviar-codigo (si eligió correo) → código de 6 dígitos
//   3. POST /login/verificar  código → sesión
//      (o, si la contraseña venció, pase CAMBIAR_CONTRASENA → paso 4)
//   4. POST /login/cambiar-contrasena → sesión
// El ADMINISTRADOR entra en el paso 1 (HU-14 no cambia en la v2.5).
const authRepositorio = require('./auth.repositorio');
const seguridad = require('./seguridad.servicio');
const { cifrar, hashCedula, hashCodigo, generarCodigo, generarTokenLink } = require('../../utils/cifrado');
const correo = require('../../utils/correo');
const {
  POLITICA_CONTRASENA, MINUTOS_LINK_VERIFICACION, MINUTOS_CODIGO_CORREO,
} = require('../../config/seguridad');

const { errorCon } = seguridad;
const MENSAJE_DATOS_INCORRECTOS = 'Correo o contraseña incorrectos';

// ---------------------------------------------------------------------
// Datos para los formularios
// ---------------------------------------------------------------------

// HU-01 · Las preguntas para elegir 3
function listarPreguntas() {
  return authRepositorio.listarPreguntas();
}

// HU-20 · La política, para que la app muestre la lista con ✓ usando
// EXACTAMENTE las mismas reglas que revisa la API.
// patron: la expresión regular en texto (la app hace new RegExp(patron)).
function obtenerPolitica() {
  return POLITICA_CONTRASENA.map((p) => ({ texto: p.texto, patron: p.regla.source }));
}

// ---------------------------------------------------------------------
// Registro y verificación del correo (HU-01)
// ---------------------------------------------------------------------

// Crea el link "¿Eres vos?", guarda su hash (vence en 24 h) y lo envía.
async function enviarLinkVerificacion(usuario) {
  const token = generarTokenLink();
  await authRepositorio.guardarToken(usuario.id, 'VERIFICACION', hashCodigo(token), MINUTOS_LINK_VERIFICACION);
  const link = `${process.env.URL_PUBLICA || 'http://localhost:3000'}/api/auth/verificar?token=${token}`;
  await correo.enviarVerificacion(usuario.correo, usuario.nombre_completo, link);
}

// HU-01 · Registro. La cuenta queda PENDIENTE: NO inicia sesión.
// datos: { nombre_completo, cedula, telefono, correo, contrasena, respuestas: [{ pregunta_id, respuesta }] }
async function registrar(datos, req) {
  // HU-23 · Cada dato se protege como corresponde antes de guardarlo
  const usuario = await authRepositorio.registrarUsuario({
    nombre_completo: datos.nombre_completo,
    cedula_cifrada: cifrar(datos.cedula),           // AES: se puede leer en el perfil
    cedula_hash: hashCedula(datos.cedula),          // HMAC: para no repetir la cédula
    telefono_cifrado: cifrar(datos.telefono),       // AES
    correo: datos.correo,
    contrasena_hash: await seguridad.hashContrasena(datos.contrasena),   // bcrypt
    respuestas: await Promise.all(datos.respuestas.map(async (r) => ({
      pregunta_id: Number(r.pregunta_id),
      respuesta_hash: await seguridad.hashRespuesta(r.respuesta),        // bcrypt
    }))),
  });

  await seguridad.auditar(req, usuario, 'REGISTRO', 'EXITO');

  // Si el correo no se pudo enviar, la cuenta ya existe: el cliente puede
  // pedir que se reenvíe desde la pantalla de inicio de sesión.
  try {
    await enviarLinkVerificacion(usuario);
  } catch (error) {
    console.error('No se pudo enviar el correo de verificación:', error.message);
    return {
      correo: usuario.correo,
      mensaje: 'Tu cuenta fue creada, pero no pudimos enviar el correo. Toca "Reenviar correo" en Iniciar sesión.',
    };
  }
  return {
    correo: usuario.correo,
    mensaje: 'Te enviamos un correo para confirmar que eres vos. Abre el link para activar tu cuenta.',
  };
}

// HU-01 · El cliente abrió el link del correo. Devuelve true si la cuenta
// quedó activa; false si el link no existe, ya se usó o venció.
async function verificarCorreo(token) {
  const usuarioId = await authRepositorio.usarToken(null, 'VERIFICACION', hashCodigo(token));
  if (!usuarioId) return false;
  await authRepositorio.activarUsuario(usuarioId);
  return true;
}

// HU-01 · "Si venció, el cliente puede pedir que se le reenvíe el correo".
// Siempre responde lo mismo, exista o no el correo: así nadie puede usar
// esta ruta para averiguar qué correos están registrados.
async function reenviarVerificacion(correoEscrito) {
  const usuario = await authRepositorio.obtenerUsuarioPorCorreo(correoEscrito);
  if (usuario && usuario.estado === 'PENDIENTE') {
    await enviarLinkVerificacion(usuario);
  }
  return { mensaje: 'Si la cuenta existe y no está confirmada, te enviamos un correo nuevo.' };
}

// ---------------------------------------------------------------------
// Inicio de sesión (HU-02, HU-14, HU-21)
// ---------------------------------------------------------------------

// Paso 1 · Correo y contraseña
async function iniciarSesion(correoEscrito, contrasena, req) {
  const usuario = await authRepositorio.obtenerUsuarioPorCorreo(correoEscrito);

  // El correo no existe: mismo mensaje que contraseña incorrecta (HU-02)
  if (!usuario) {
    await seguridad.auditar(req, null, 'LOGIN_FALLIDO', 'FALLO', correoEscrito);
    throw errorCon(401, MENSAJE_DATOS_INCORRECTOS);
  }

  // HU-02 · Bloqueada: no se acepta ningún intento
  try {
    seguridad.revisarBloqueo(usuario);
  } catch (error) {
    await seguridad.auditar(req, usuario, 'LOGIN_FALLIDO', 'FALLO');
    throw error;
  }

  // Contraseña incorrecta: suma un intento (al tercero, bloqueo)
  if (!(await seguridad.compararContrasena(contrasena, usuario.contrasena_hash))) {
    await seguridad.auditar(req, usuario, 'LOGIN_FALLIDO', 'FALLO');
    const bloqueada = await seguridad.registrarFallo(usuario, req);
    throw seguridad.errorDeFallo(bloqueada, 401, MENSAJE_DATOS_INCORRECTOS);
  }

  // HU-01 · La contraseña es correcta pero el correo no está confirmado
  if (usuario.estado === 'PENDIENTE') {
    throw errorCon(403, 'Debes confirmar tu correo antes de entrar. Revisa tu bandeja o pide un correo nuevo.',
      { pendiente: true });
  }

  // HU-14 · El administrador entra sin doble factor (sin cambios en la v2.5)
  if (usuario.rol === 'ADMIN') {
    await seguridad.reiniciarIntentos(usuario);
    await seguridad.auditar(req, usuario, 'LOGIN_EXITOSO', 'EXITO');
    return { paso: 'LISTO', usuario: seguridad.datosPublicos(usuario), token: seguridad.crearSesion(usuario) };
  }

  // HU-21 · El cliente elige cómo recibir el código
  const metodos = ['CORREO'];
  if (usuario.authenticator_activo) metodos.push('AUTENTICADOR');
  return { paso: 'DOBLE_FACTOR', pase: seguridad.crearPase(usuario, 'DOBLE_FACTOR'), metodos };
}

// Paso 2 · Envía el código de 6 dígitos al correo (vence en 2 minutos).
// Pedir otro hace que el anterior deje de servir.
async function enviarCodigoLogin(pase) {
  const usuario = await authRepositorio.obtenerUsuarioPorCorreo(pase.correo);
  if (!usuario) throw errorCon(401, 'Empieza de nuevo');
  seguridad.revisarBloqueo(usuario);

  const codigo = generarCodigo();
  await authRepositorio.guardarToken(usuario.id, 'DOBLE_FACTOR', hashCodigo(codigo), MINUTOS_CODIGO_CORREO);
  await correo.enviarCodigo(usuario.correo, codigo);
  return { mensaje: `Te enviamos un código a ${usuario.correo}`, segundos: MINUTOS_CODIGO_CORREO * 60 };
}

// Paso 3 · Revisa el código. metodo: 'CORREO' o 'AUTENTICADOR'
async function verificarCodigoLogin(pase, metodo, codigo, req) {
  const usuario = await authRepositorio.obtenerUsuarioPorCorreo(pase.correo);
  if (!usuario) throw errorCon(401, 'Empieza de nuevo');
  seguridad.revisarBloqueo(usuario);

  const valido = metodo === 'AUTENTICADOR'
    ? await seguridad.validarCodigoAutenticador(usuario.id, codigo)
    // El código del correo: se busca su hash; si sirve, queda usado
    : Boolean(await authRepositorio.usarToken(usuario.id, 'DOBLE_FACTOR', hashCodigo(codigo)));

  // HU-21 · "Un código incorrecto cuenta como intento fallido"
  if (!valido) {
    await seguridad.auditar(req, usuario, 'LOGIN_FALLIDO', 'FALLO');
    const bloqueada = await seguridad.registrarFallo(usuario, req);
    throw seguridad.errorDeFallo(bloqueada, 401, 'Código incorrecto o vencido');
  }

  await seguridad.reiniciarIntentos(usuario);

  // HU-20 · Contraseña vencida: se pide cambiarla antes de entrar
  if (seguridad.contrasenaVencida(usuario)) {
    return {
      paso: 'CAMBIAR_CONTRASENA',
      pase: seguridad.crearPase(usuario, 'CAMBIAR_CONTRASENA'),
      mensaje: 'Tu contraseña venció. Crea una nueva para continuar.',
    };
  }

  await seguridad.auditar(req, usuario, 'LOGIN_EXITOSO', 'EXITO');
  return { paso: 'LISTO', usuario: seguridad.datosPublicos(usuario), token: seguridad.crearSesion(usuario) };
}

// Paso 4 (solo si venció) · Contraseña nueva y entra
async function cambiarContrasenaVencida(pase, contrasenaNueva, req) {
  const usuario = await authRepositorio.obtenerUsuarioPorCorreo(pase.correo);
  if (!usuario) throw errorCon(401, 'Empieza de nuevo');

  await seguridad.guardarContrasenaNueva(usuario.id, contrasenaNueva);
  await seguridad.auditar(req, usuario, 'CAMBIO_CONTRASENA', 'EXITO');
  await correo.avisarCambioContrasena(usuario.correo, usuario.nombre_completo).catch(() => {});
  await seguridad.auditar(req, usuario, 'LOGIN_EXITOSO', 'EXITO');
  return { paso: 'LISTO', usuario: seguridad.datosPublicos(usuario), token: seguridad.crearSesion(usuario) };
}

module.exports = {
  listarPreguntas,
  obtenerPolitica,
  registrar,
  verificarCorreo,
  reenviarVerificacion,
  iniciarSesion,
  enviarCodigoLogin,
  verificarCodigoLogin,
  cambiarContrasenaVencida,
};
