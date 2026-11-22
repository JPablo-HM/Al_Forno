// =====================================================================
// CLIENTE DE PAYPAL SANDBOX (HU-08)
//
// PayPal es un servicio externo real, en su modo de pruebas (Sandbox):
// no se cobra dinero real. Se usan las llaves de la app de Al Forno en
// developer.paypal.com (PAYPAL_CLIENT_ID y PAYPAL_SECRET en .env).
//
// El pago tiene 2 pasos (API "Orders v2" de PayPal):
//   1. crearOrden(dolares)  → PayPal devuelve un link. El cliente lo abre,
//                             entra con su cuenta de PayPal y APRUEBA.
//   2. cobrarOrden(orden)   → ya aprobada, se hace el cobro (capture).
// Se cobra en dólares (USD): PayPal no maneja colones en su lista normal.
// =====================================================================
const { errorCon } = require('./errores');

const PAYPAL_URL = process.env.PAYPAL_URL || 'https://api-m.sandbox.paypal.com';

// Después de aprobar (o cancelar), PayPal manda al cliente a esta página:
// su propia cuenta de PayPal Sandbox, donde puede ver el pago. Luego el
// cliente vuelve a la app y toca "Confirmar pago".
const PAGINA_REGRESO = 'https://www.sandbox.paypal.com/myaccount/summary';

// Llama a PayPal. Si no responde (sin internet, caído), 503.
async function llamarPaypal(ruta, opciones) {
  try {
    return await fetch(`${PAYPAL_URL}${ruta}`, { ...opciones, signal: AbortSignal.timeout(15000) });
  } catch {
    throw errorCon(503, 'PayPal no responde en este momento. Intenta de nuevo más tarde.');
  }
}

// Token de acceso de PayPal (se pide con las llaves de la app).
async function obtenerToken() {
  const llaves = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString('base64');
  const respuesta = await llamarPaypal('/v1/oauth2/token', {
    method: 'POST',
    headers: { Authorization: `Basic ${llaves}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  const cuerpo = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    console.error('PayPal token:', respuesta.status, cuerpo);
    throw errorCon(503, 'No se pudo conectar con PayPal');
  }
  return cuerpo.access_token;
}

// Paso 1 · Crea la orden de pago en dólares.
// Devuelve { orden: 'id de PayPal', link: 'página donde el cliente aprueba' }.
async function crearOrden(dolares, descripcion) {
  const token = await obtenerToken();
  const respuesta = await llamarPaypal('/v2/checkout/orders', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{ description: descripcion, amount: { currency_code: 'USD', value: dolares.toFixed(2) } }],
      payment_source: {
        paypal: {
          experience_context: {
            brand_name: 'AL FORNO',
            user_action: 'PAY_NOW',
            shipping_preference: 'NO_SHIPPING', // pedido para recoger: sin dirección de envío
            return_url: PAGINA_REGRESO,
            cancel_url: PAGINA_REGRESO,
          },
        },
      },
    }),
  });
  const cuerpo = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    console.error('PayPal crear orden:', respuesta.status, cuerpo);
    throw errorCon(503, 'No se pudo crear el pago en PayPal');
  }
  // El link para aprobar viene en la lista "links" (rel 'payer-action').
  const link = cuerpo.links.find((l) => l.rel === 'payer-action' || l.rel === 'approve').href;
  return { orden: cuerpo.id, link };
}

// Paso 2 · Cobra la orden ya aprobada por el cliente.
// Devuelve la referencia del cobro en PayPal. Si el cliente no aprobó, 402.
async function cobrarOrden(orden) {
  const token = await obtenerToken();
  const respuesta = await llamarPaypal(`/v2/checkout/orders/${encodeURIComponent(orden)}/capture`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  const cuerpo = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok || cuerpo.status !== 'COMPLETED') {
    console.error('PayPal cobrar orden:', respuesta.status, cuerpo.details || cuerpo);
    throw errorCon(402, 'El pago no se completó. Aprueba el pago en PayPal y vuelve a tocar "Confirmar pago".');
  }
  return cuerpo.purchase_units[0].payments.captures[0].id;
}

module.exports = { crearOrden, cobrarOrden };
