// CAPA ACCESO A DATOS (repositorio) del módulo Pedidos (HU-07, HU-08, HU-09).
// Es la única capa que habla con MySQL: solo llama procedimientos almacenados.
const pool = require('../../config/db');

// ★ HU-07 / HU-08 · Guarda un pedido ya pagado → sp_CrearPedido (TRANSACCIÓN)
// productos = [{ producto_id, cantidad }] → se manda como texto JSON.
// El 2.º parámetro (nota) va NULL: no se usa en esta versión (HU v2.4).
// El procedimiento termina con sp_ObtenerPedido, que devuelve DOS resultados:
//   resultados[0] = datos del pedido · resultados[1] = sus productos
async function crearPedido(usuarioId, ultimos4, productos) {
  const [resultados] = await pool.query('CALL sp_CrearPedido(?, NULL, ?, ?)', [
    usuarioId, ultimos4, JSON.stringify(productos),
  ]);
  return { pedido: resultados[0][0], productos: resultados[1] };
}

// HU-09 · Mis pedidos (del más reciente al más antiguo) → sp_ListarPedidosCliente
async function listarPedidosCliente(usuarioId) {
  const [resultados] = await pool.query('CALL sp_ListarPedidosCliente(?)', [usuarioId]);
  return resultados[0];
}

// HU-08 / HU-09 · Un pedido con sus productos → sp_ObtenerPedido
// Se pasa el usuarioId para que un cliente SOLO vea sus propios pedidos.
// pedido = undefined si no existe o es de otro cliente.
async function obtenerPedido(id, usuarioId) {
  const [resultados] = await pool.query('CALL sp_ObtenerPedido(?, ?)', [id, usuarioId]);
  return { pedido: resultados[0][0], productos: resultados[1] };
}

module.exports = { crearPedido, listarPedidosCliente, obtenerPedido };
