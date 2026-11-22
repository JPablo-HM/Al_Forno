// =====================================================================
// CLIENTES DE LOS SOCIOS COMERCIALES (Python + Flask, carpeta socios/)
//
// Cada socio es una empresa aparte con su propia base de datos. Aquí solo
// se les habla por HTTP (fetch) y se lee su respuesta.
//
//   Cartelera de eventos       CARTELERA_URL    GET  /eventos
//   Cervecería artesanal       CERVECERIA_URL   GET  /disponibles
//   Facturación electrónica    FACTURACION_URL  POST /facturas · GET /facturas/:pedido_id
// =====================================================================
const { errorCon } = require('./errores');

const CARTELERA_URL = process.env.CARTELERA_URL || 'http://localhost:5002';
const CERVECERIA_URL = process.env.CERVECERIA_URL || 'http://localhost:5005';
const FACTURACION_URL = process.env.FACTURACION_URL || 'http://localhost:5003';

// Llama a un socio. Devuelve su respuesta, o null si respondió 404 (no existe).
// Si el socio está apagado o falla, lanza un error 503 con su nombre.
async function llamarSocio(nombre, url, cuerpo) {
  let respuesta;
  try {
    respuesta = await fetch(url, {
      method: cuerpo ? 'POST' : 'GET',
      headers: cuerpo ? { 'Content-Type': 'application/json' } : undefined,
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
      signal: AbortSignal.timeout(5000), // si en 5 s no contesta, se cancela
    });
  } catch {
    throw errorCon(503, `${nombre} no responde en este momento. Intenta de nuevo más tarde.`);
  }
  if (respuesta.status === 404) return null;
  if (!respuesta.ok) {
    console.error(`${nombre} respondió ${respuesta.status}`);
    throw errorCon(503, `${nombre} no está disponible en este momento.`);
  }
  return respuesta.json();
}

// Cartelera · eventos de la semana: [{ id, dias, nombre, descripcion }]
const listarEventos = () => llamarSocio('La cartelera de eventos', `${CARTELERA_URL}/eventos`);

// Cervecería · cervezas artesanales disponibles esta semana (las que se sirven
// como "Cerveza artesanal costarricense" del menú): [{ id, nombre, estilo, descripcion }]
const listarNovedades = () => llamarSocio('La cervecería', `${CERVECERIA_URL}/disponibles`);

// Facturación · emite la factura de un pedido (si ya existía, devuelve la misma)
// → { numero, clave, pedido_id, cliente, total, fecha }
const emitirFactura = (pedidoId, cliente, total) =>
  llamarSocio('El servicio de facturación', `${FACTURACION_URL}/facturas`, { pedido_id: pedidoId, cliente, total });

// Facturación · la factura de un pedido, o null si no tiene
const obtenerFactura = (pedidoId) =>
  llamarSocio('El servicio de facturación', `${FACTURACION_URL}/facturas/${pedidoId}`);

module.exports = { listarEventos, listarNovedades, emitirFactura, obtenerFactura };
