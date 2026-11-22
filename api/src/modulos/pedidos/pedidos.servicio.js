// CAPA LÓGICA DE NEGOCIO (servicio) del módulo Pedidos (HU-07, HU-08, HU-09).
const pedidosRepositorio = require('./pedidos.repositorio');
const menuRepositorio = require('../menu/menu.repositorio');
const banco = require('../../utils/banco');
const paypal = require('../../utils/paypal');
const socios = require('../../utils/socios');
const correo = require('../../utils/correo');
const authRepositorio = require('../auth/auth.repositorio');
const tipoCambioServicio = require('../tipo-cambio/tipo-cambio.servicio');
const { segundosDesde } = require('../../utils/tiempo');
const { errorCon } = require('../../utils/errores');

// Estado del pedido (decisión del proyecto): nadie cambia los estados a
// mano, así que el estado se CALCULA al leer el pedido, sin tocar la base:
//   · menos de 10 segundos desde que se pagó → 'Recibido'
//   · 10 segundos o más                       → 'Listo para recoger'
const SEGUNDOS_PARA_LISTO = 10;

function calcularEstado(fecha) {
  const pasaron = segundosDesde(fecha);
  return {
    estado: pasaron >= SEGUNDOS_PARA_LISTO ? 'Listo para recoger' : 'Recibido',
    // Cuánto falta para "Listo" (0 si ya está). La app lo usa para
    // actualizarse sola justo a tiempo.
    segundosParaListo: Math.max(0, SEGUNDOS_PARA_LISTO - pasaron),
  };
}

// Factura electrónica del pedido (socio Facturación electrónica).
// Se pide la que ya existe; si no tiene, se emite en ese momento. Así, si
// el socio estaba apagado al pagar, la factura sale la próxima vez que se
// abra el comprobante. Si el socio no responde, devuelve null ("pendiente"):
// el pedido ya está pagado y eso no cambia.
async function facturaDe(pedido) {
  try {
    const factura = (await socios.obtenerFactura(pedido.id))
      ?? (await socios.emitirFactura(pedido.id, pedido.cliente, pedido.total));
    return { numero: factura.numero, clave: factura.clave };
  } catch (error) {
    console.error('Factura del pedido', pedido.id, ':', error.message);
    return null;
  }
}

// Manda la factura al correo del cliente. Si el correo falla, el pago no
// se afecta: el error queda en la consola y la factura se ve en la app.
async function enviarFacturaPorCorreo(usuarioId, comprobante) {
  if (!comprobante.factura) return; // factura pendiente: no hay qué enviar
  try {
    const usuario = await authRepositorio.obtenerUsuario(usuarioId);
    await correo.enviarFactura(usuario.correo, comprobante);
  } catch (error) {
    console.error('No se pudo enviar la factura por correo:', error.message);
  }
}

// Arma el comprobante que recibe la app: datos del pedido + productos +
// estado + factura electrónica (null = pendiente).
async function armarComprobante({ pedido, productos }) {
  return {
    id: pedido.id,
    fecha: pedido.fecha,
    total: pedido.total,
    metodo_pago: pedido.metodo_pago,         // 'Tarjeta', 'SINPE Móvil' o 'PayPal'
    detalle_pago: pedido.detalle_pago,       // 'Visa •••• 1111' o 'PayPal · $30,26'
    referencia_pago: pedido.referencia_pago, // referencia del banco o de PayPal
    cliente: pedido.cliente,
    ...calcularEstado(pedido.fecha),
    productos, // [{ nombre, cantidad, precio_unitario, subtotal }]
    factura: await facturaDe(pedido), // { numero, clave } o null
  };
}

// Total del carrito con los precios de la BASE (nunca con los de la app).
// Si un producto ya no está en el menú, no se cobra nada.
async function calcularTotal(productos) {
  const menu = await menuRepositorio.listarMenu();
  const precios = new Map(menu.map((p) => [p.id, p.precio]));
  let total = 0;
  for (const { producto_id, cantidad } of productos) {
    if (!precios.has(producto_id)) throw errorCon(409, 'Uno de los productos ya no está disponible');
    total += precios.get(producto_id) * cantidad;
  }
  return total;
}

// ★ HU-07 / HU-08 · Pagar con tarjeta o SINPE Móvil y crear el pedido.
// 1. Revisa que no venga el mismo producto dos veces.
// 2. Calcula el total con los precios de la base.
// 3. Cobra en el socio Banco Simulado (tarjeta o SINPE Móvil). Si el banco
//    rechaza, NO se guarda nada (el carrito sigue en la app).
// 4. Guarda el pedido con la forma de pago y la referencia del banco.
// 5. Pide la factura al socio Facturación y la manda al correo del cliente.
// pago = { metodo_pago: 'Tarjeta', tarjeta: {...} } o { metodo_pago: 'SINPE Móvil', telefono }
// No puede venir el mismo producto dos veces en el carrito.
function revisarRepetidos(productos) {
  const ids = productos.map((p) => p.producto_id);
  if (new Set(ids).size !== ids.length) {
    throw errorCon(400, 'Un producto viene repetido en el carrito');
  }
}

async function crearPedido(usuarioId, productos, pago) {
  revisarRepetidos(productos);

  const total = await calcularTotal(productos);
  const descripcion = 'AL FORNO · Pedido para llevar';
  const cobro = pago.metodo_pago === 'Tarjeta'
    ? await banco.pagarConTarjeta(pago.tarjeta, total, descripcion)
    : await banco.pagarConSinpe(pago.telefono, total, descripcion);

  const comprobante = await armarComprobante(await pedidosRepositorio.crearPedido(usuarioId, {
    metodo: pago.metodo_pago, detalle: cobro.detalle, referencia: cobro.referencia,
  }, productos));
  await enviarFacturaPorCorreo(usuarioId, comprobante);
  return comprobante;
}

// HU-09 · Mis pedidos, cada uno con su estado calculado.
async function listarMisPedidos(usuarioId) {
  const pedidos = await pedidosRepositorio.listarPedidosCliente(usuarioId);
  return pedidos.map((p) => ({
    id: p.id,
    fecha: p.fecha,
    total: p.total,
    estado: calcularEstado(p.fecha).estado,
  }));
}

// HU-08 / HU-09 · Detalle y comprobante de UN pedido del cliente.
async function obtenerPedido(id, usuarioId) {
  const resultado = await pedidosRepositorio.obtenerPedido(id, usuarioId);
  // Si no existe o es de otro cliente, se responde igual: "no existe".
  if (!resultado.pedido) throw errorCon(404, 'El pedido no existe');
  return armarComprobante(resultado);
}

// ---------------------------------------------------------------------
// PAGO CON PAYPAL (HU-08) · en 2 pasos, porque el cliente aprueba el
// pago fuera de la app, en la página de PayPal.
// ---------------------------------------------------------------------

// Pagos de PayPal que esperan confirmación: orden → { usuarioId, productos, dolares }.
// Se guardan aquí (en memoria) para que al confirmar se cobre exactamente
// lo que se calculó y solo lo pueda confirmar el mismo cliente.
// Si la API se reinicia a mitad de un pago, ese pago se pierde.
const pagosPaypal = new Map();

// Paso 1 · Calcula el total en colones, lo pasa a dólares con el tipo de
// cambio de VENTA del BCCR y crea la orden en PayPal.
// Devuelve { orden, link, dolares, venta }.
async function iniciarPagoPaypal(usuarioId, productos) {
  revisarRepetidos(productos);
  const total = await calcularTotal(productos);
  const { venta } = await tipoCambioServicio.obtenerTipoCambio();
  const dolares = Math.round((total / venta) * 100) / 100; // 2 decimales

  const { orden, link } = await paypal.crearOrden(dolares, 'AL FORNO · Pedido para llevar');
  pagosPaypal.set(orden, { usuarioId, productos, dolares });
  return { orden, link, dolares, venta };
}

// Paso 2 · El cliente ya aprobó en PayPal: se cobra y se guarda el pedido.
async function confirmarPagoPaypal(usuarioId, orden) {
  const pago = pagosPaypal.get(orden);
  if (!pago || pago.usuarioId !== usuarioId) throw errorCon(404, 'El pago de PayPal no existe');

  const referencia = await paypal.cobrarOrden(orden); // si no aprobó → 402
  pagosPaypal.delete(orden);

  const detalle = `PayPal · $${pago.dolares.toFixed(2).replace('.', ',')}`; // 'PayPal · $30,26'
  const comprobante = await armarComprobante(await pedidosRepositorio.crearPedido(usuarioId, {
    metodo: 'PayPal', detalle, referencia,
  }, pago.productos));
  await enviarFacturaPorCorreo(usuarioId, comprobante);
  return comprobante;
}

module.exports = { crearPedido, listarMisPedidos, obtenerPedido, iniciarPagoPaypal, confirmarPagoPaypal };
