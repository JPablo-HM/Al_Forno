// CAPA LÓGICA DE NEGOCIO (servicio) del módulo Pedidos (HU-07, HU-08, HU-09).
const pedidosRepositorio = require('./pedidos.repositorio');
const menuRepositorio = require('../menu/menu.repositorio');
const banco = require('../../utils/banco');
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

// Arma el comprobante que recibe la app: datos del pedido + productos + estado.
function armarComprobante({ pedido, productos }) {
  return {
    id: pedido.id,
    fecha: pedido.fecha,
    total: pedido.total,
    metodo_pago: pedido.metodo_pago,         // 'Tarjeta' o 'SINPE Móvil'
    detalle_pago: pedido.detalle_pago,       // 'Visa •••• 1111'
    referencia_pago: pedido.referencia_pago, // referencia del banco
    cliente: pedido.cliente,
    ...calcularEstado(pedido.fecha),
    productos, // [{ nombre, cantidad, precio_unitario, subtotal }]
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

// ★ HU-07 / HU-08 · Pagar y crear el pedido.
// 1. Revisa que no venga el mismo producto dos veces.
// 2. Calcula el total con los precios de la base.
// 3. Cobra en el socio Banco Simulado (tarjeta o SINPE Móvil). Si el banco
//    rechaza, NO se guarda nada (el carrito sigue en la app).
// 4. Guarda el pedido con la forma de pago y la referencia del banco.
// pago = { metodo_pago: 'Tarjeta', tarjeta: {...} } o { metodo_pago: 'SINPE Móvil', telefono }
async function crearPedido(usuarioId, productos, pago) {
  const ids = productos.map((p) => p.producto_id);
  if (new Set(ids).size !== ids.length) {
    throw errorCon(400, 'Un producto viene repetido en el carrito');
  }

  const total = await calcularTotal(productos);
  const descripcion = 'AL FORNO · Pedido para llevar';
  const cobro = pago.metodo_pago === 'Tarjeta'
    ? await banco.pagarConTarjeta(pago.tarjeta, total, descripcion)
    : await banco.pagarConSinpe(pago.telefono, total, descripcion);

  return armarComprobante(await pedidosRepositorio.crearPedido(usuarioId, {
    metodo: pago.metodo_pago, detalle: cobro.detalle, referencia: cobro.referencia,
  }, productos));
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

module.exports = { crearPedido, listarMisPedidos, obtenerPedido };
