// =====================================================================
// Envío de correos (HU-01, HU-21, HU-22) con nodemailer y Gmail.
//
// Datos en el .env:
//   CORREO_USUARIO    → la cuenta de Gmail que envía
//   CORREO_CONTRASENA → la "contraseña de aplicación" de Google (16 letras),
//                       NO la contraseña normal de la cuenta
//
// MODO PRUEBA: si CORREO_CONTRASENA está vacío, no se envía nada; el
// correo se muestra en la consola de la API (con el link o el código).
// Sirve para probar sin depender de Gmail.
// =====================================================================
const nodemailer = require('nodemailer');

function modoPrueba() {
  return !process.env.CORREO_CONTRASENA;
}

// El "transporte" es la conexión con Gmail. Se crea una sola vez.
let transporte = null;
function obtenerTransporte() {
  if (!transporte) {
    transporte = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.CORREO_USUARIO, pass: process.env.CORREO_CONTRASENA },
    });
  }
  return transporte;
}

// Evita que un nombre como "<b>Ana</b>" se interprete como HTML en el correo.
function escapar(texto) {
  return String(texto).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

// Plantilla sencilla con los colores de AL FORNO.
function plantilla(titulo, contenido) {
  return `
  <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;color:#2b2420">
    <h2 style="color:#b0512f;margin-bottom:4px">AL FORNO</h2>
    <h3 style="margin-top:0">${titulo}</h3>
    ${contenido}
    <p style="color:#6d6159;font-size:12px;margin-top:24px">
      Si no fuiste vos, ignorá este correo. Nunca te pediremos tu contraseña.
    </p>
  </div>`;
}

async function enviar(para, asunto, html, textoConsola) {
  if (modoPrueba()) {
    console.log('\n──────── CORREO (modo prueba, no se envió) ────────');
    console.log(`Para: ${para}\nAsunto: ${asunto}\n${textoConsola}`);
    console.log('───────────────────────────────────────────────────\n');
    return;
  }
  await obtenerTransporte().sendMail({
    from: `"AL FORNO" <${process.env.CORREO_USUARIO}>`,
    to: para,
    subject: asunto,
    html,
  });
}

// HU-01 · "¿Eres vos?" con el link para confirmar la cuenta
function enviarVerificacion(para, nombre, link) {
  return enviar(
    para,
    '¿Eres vos? Confirmá tu cuenta de AL FORNO',
    plantilla(`Hola, ${escapar(nombre)}`, `
      <p>Alguien creó una cuenta en AL FORNO con este correo. ¿Eres vos?</p>
      <p><a href="${link}" style="background:#b0512f;color:#fff;padding:10px 18px;
         border-radius:6px;text-decoration:none;display:inline-block">Sí, soy yo: confirmar mi cuenta</a></p>
      <p style="font-size:13px">El link vence en 24 horas y solo se puede usar una vez.</p>`),
    `Link de verificación: ${link}`
  );
}

// HU-21 · Código de 6 dígitos para iniciar sesión
function enviarCodigo(para, codigo) {
  return enviar(
    para,
    `Tu código de AL FORNO: ${codigo}`,
    plantilla('Tu código para iniciar sesión', `
      <p style="font-size:32px;letter-spacing:8px;font-weight:bold">${codigo}</p>
      <p style="font-size:13px">Vence en 2 minutos y solo se puede usar una vez.</p>`),
    `Código: ${codigo}`
  );
}

// HU-20 / HU-22 · Aviso de que la contraseña cambió
function avisarCambioContrasena(para, nombre) {
  return enviar(
    para,
    'Tu contraseña de AL FORNO cambió',
    plantilla(`Hola, ${escapar(nombre)}`, `
      <p>Te avisamos que la contraseña de tu cuenta se cambió.</p>
      <p style="font-size:13px">Si no fuiste vos, recuperá tu cuenta desde la app
         con "¿Olvidaste tu contraseña?".</p>`),
    'Aviso: la contraseña cambió'
  );
}

module.exports = { enviarVerificacion, enviarCodigo, avisarCambioContrasena };
