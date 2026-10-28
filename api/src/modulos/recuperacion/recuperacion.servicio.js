// CAPA LÓGICA DE NEGOCIO (servicio) del módulo Recuperación (HU-22).
//
// Este módulo no tiene repositorio propio: usa el de la cuenta
// (auth/auth.repositorio.js), que ya tiene todas las llamadas a MySQL.
//
// FLUJO (cada paso entrega un pase para el siguiente):
//   1. inicio    correo → las 3 preguntas y los métodos disponibles
//   2. verificar respuestas (PREGUNTAS) o código (AUTENTICADOR)
//   3. nueva     contraseña nueva (política + no repetir las últimas 5)
// Los intentos fallidos cuentan para el bloqueo de HU-02.
const authRepositorio = require('../auth/auth.repositorio');
const seguridad = require('../auth/seguridad.servicio');
const correo = require('../../utils/correo');

const { errorCon } = require('../../utils/errores');

// Paso 1 · ¿Existe una cuenta de cliente activa con ese correo?
async function iniciar(correoEscrito) {
  const usuario = await authRepositorio.obtenerUsuarioPorCorreo(correoEscrito);
  // El administrador no tiene preguntas: su cuenta se maneja por script.
  if (!usuario || usuario.estado !== 'ACTIVO' || usuario.rol !== 'CLIENTE') {
    throw errorCon(404, 'No encontramos una cuenta activa con ese correo');
  }
  seguridad.revisarBloqueo(usuario);

  // Solo el texto: los hashes de las respuestas nunca salen de la API.
  const preguntas = (await authRepositorio.obtenerPreguntasUsuario(usuario.id))
    .map(({ pregunta_id, texto }) => ({ pregunta_id, texto }));

  // HU-22: Google Authenticator solo aparece si el cliente lo vinculó.
  const metodos = ['PREGUNTAS'];
  if (usuario.authenticator_activo) metodos.push('AUTENTICADOR');

  return { pase: seguridad.crearPase(usuario, 'RECUPERAR'), metodos, preguntas };
}

// Paso 2 · Comprueba que es él.
// datos: { metodo: 'PREGUNTAS', respuestas: [{ pregunta_id, respuesta }] }
//     o  { metodo: 'AUTENTICADOR', codigo }
async function verificar(pase, datos, req) {
  const usuario = await authRepositorio.obtenerUsuarioPorCorreo(pase.correo);
  if (!usuario) throw errorCon(401, 'Empieza de nuevo');
  seguridad.revisarBloqueo(usuario);

  let correcto;
  if (datos.metodo === 'AUTENTICADOR') {
    correcto = await seguridad.validarCodigoAutenticador(usuario.id, datos.codigo);
  } else {
    const guardadas = await authRepositorio.obtenerPreguntasUsuario(usuario.id);
    correcto = await seguridad.respuestasCorrectas(guardadas, datos.respuestas);
  }

  if (!correcto) {
    await seguridad.auditar(req, usuario, 'RECUPERACION', 'FALLO');
    const bloqueada = await seguridad.registrarFallo(usuario, req);
    // HU-22: "sin indicar qué respuesta estuvo mal"
    const mensaje = datos.metodo === 'AUTENTICADOR'
      ? 'Código incorrecto'
      : 'Las respuestas no coinciden con las que guardaste';
    throw seguridad.errorDeFallo(bloqueada, 401, mensaje);
  }

  await seguridad.reiniciarIntentos(usuario);
  return { pase: seguridad.crearPase(usuario, 'NUEVA_CONTRASENA') };
}

// Paso 3 · Contraseña nueva. Avisa por correo que cambió.
async function guardarNueva(pase, contrasenaNueva, req) {
  const usuario = await authRepositorio.obtenerUsuarioPorCorreo(pase.correo);
  if (!usuario) throw errorCon(401, 'Empieza de nuevo');

  await seguridad.guardarContrasenaNueva(usuario.id, contrasenaNueva);
  await seguridad.auditar(req, usuario, 'RECUPERACION', 'EXITO');
  // Si el aviso no se pudo enviar, la contraseña igual quedó cambiada.
  await correo.avisarCambioContrasena(usuario.correo, usuario.nombre_completo)
    .catch((error) => console.error('No se pudo enviar el aviso:', error.message));

  return { mensaje: 'Tu contraseña se cambió. Ya puedes iniciar sesión con la nueva.' };
}

module.exports = { iniciar, verificar, guardarNueva };
