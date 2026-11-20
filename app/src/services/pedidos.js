// Servicios del módulo Pedidos (HU-07, HU-08, HU-09).
// Todas piden el token de la sesión: la API sabe quién es el cliente por él.
import { pedir } from './api';

// HU-07 / HU-08 · Pagar y crear el pedido → POST /api/pedidos
// productos = [{ producto_id, cantidad }]
// pago = { metodo_pago: 'Tarjeta', tarjeta: { numero, vencimiento, cvv } }
//     o  { metodo_pago: 'SINPE Móvil', telefono }
// Devuelve el comprobante: { id, fecha, total, metodo_pago, detalle_pago,
//   referencia_pago, estado, segundosParaListo, productos }
export const crearPedido = (token, productos, pago) =>
  pedir('/pedidos', { metodo: 'POST', cuerpo: { productos, ...pago }, token });

// HU-09 · Mis pedidos → GET /api/pedidos
// Devuelve [{ id, fecha, total, estado }] del más reciente al más antiguo
export const listarMisPedidos = (token) => pedir('/pedidos', { token });

// HU-08 / HU-09 · Detalle y comprobante → GET /api/pedidos/:id
export const obtenerPedido = (token, id) => pedir(`/pedidos/${id}`, { token });
