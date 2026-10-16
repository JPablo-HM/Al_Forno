// CAPA LÓGICA DE NEGOCIO (servicio) del módulo Pedidos (HU-07, HU-08, HU-09).
const pedidosRepositorio = require('./pedidos.repositorio');
const { procesarPago } = require('../../utils/simuladorPagos');
const { segundosDesde } = require('../../utils/tiempo');

// Estado del pedido (decisión del proyecto): el administrador ya no cambia
// estados, así que el estado se CALCULA al leer el pedido, sin tocar la base:
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
    tarjeta_ultimos4: pedido.tarjeta_ultimos4,
    cliente: pedido.cliente,
    ...calcularEstado(pedido.fecha),
    productos, // [{ nombre, cantidad, precio_unitario, subtotal }]
  };
}

// Crea un error con el estado HTTP que verá la app.
function errorCon(status, mensaje) {
  const error = new Error(mensaje);
  error.status = status;
  return error;
}

// ★ HU-07 / HU-08 · Pagar y crear el pedido.
// 1. Revisa que no venga el mismo producto dos veces.
// 2. Simula el pago. Si se rechaza, NO se guarda nada (el carrito sigue en la app).
// 3. Guarda el pedido. El precio sale de la base, no de la app.
async function crearPedido(usuarioId, productos, tarjeta) {
  const ids = productos.map((p) => p.producto_id);
  if (new Set(ids).size !== ids.length) {
    throw errorCon(400, 'Un producto viene repetido en el carrito');
  }

  const pago = procesarPago(tarjeta);
  if (!pago.aprobado) throw errorCon(402, pago.motivo); // 402 = pago requerido

  return armarComprobante(await pedidosRepositorio.crearPedido(usuarioId, pago.ultimos4, productos));
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
