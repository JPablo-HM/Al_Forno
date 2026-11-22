// =====================================================================
// CLIENTE DEL SOCIO "BANCO SIMULADO" (HU-08)
//
// El cobro NO lo hace esta API: lo hace el socio comercial Banco Simulado
// (C# .NET, carpeta socios/banco/), que tiene su propia base de datos.
// Aquí solo se le envían los datos por HTTP (fetch) y se lee su respuesta.
//
//   POST {BANCO_URL}/pagos/tarjeta  { numero, vencimiento, cvv, monto, descripcion }
//   POST {BANCO_URL}/pagos/sinpe    { telefono, monto, descripcion }
//
// El banco responde 200 { aprobado: true, referencia, ... } si cobró, o
// 400/402 { aprobado: false, mensaje } con el motivo del rechazo.
// La tarjeta completa y el CVV solo pasan por aquí: nunca se guardan.
// =====================================================================
const { errorCon } = require('./errores');

const BANCO_URL = process.env.BANCO_URL || 'http://localhost:5001';

async function llamarBanco(ruta, datos) {
  let respuesta;
  try {
    respuesta = await fetch(`${BANCO_URL}${ruta}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos),
      signal: AbortSignal.timeout(10000), // si en 10 s no contesta, se cancela
    });
  } catch {
    // El banco está apagado o no responde
    throw errorCon(503, 'El banco no responde en este momento. Intenta de nuevo más tarde.');
  }

  const cuerpo = await respuesta.json().catch(() => ({}));
  // Rechazo del banco → 402 (pago requerido) con el motivo que dio el banco
  if (!respuesta.ok || !cuerpo.aprobado) {
    throw errorCon(402, cuerpo.mensaje || 'El banco rechazó el pago');
  }
  return cuerpo;
}

// Cobra con tarjeta. Devuelve { referencia, detalle: 'Visa •••• 1111' }.
async function pagarConTarjeta({ numero, vencimiento, cvv }, monto, descripcion) {
  const r = await llamarBanco('/pagos/tarjeta', { numero, vencimiento, cvv, monto, descripcion });
  return { referencia: r.referencia, detalle: `${r.marca} •••• ${r.ultimos4}` };
}

// Cobra con SINPE Móvil. Devuelve { referencia, detalle: 'Teléfono •••• 1111' }.
async function pagarConSinpe(telefono, monto, descripcion) {
  const r = await llamarBanco('/pagos/sinpe', { telefono, monto, descripcion });
  return { referencia: r.referencia, detalle: `Teléfono •••• ${r.ultimos4}` };
}

module.exports = { pagarConTarjeta, pagarConSinpe };
