// Servicios del módulo Pedidos (HU-07, HU-08, HU-09).
// Todas piden el token de la sesión: la API sabe quién es el cliente por él.
import { pedir } from './api';

// HU-07 / HU-08 · Pagar y crear el pedido → POST /api/pedidos
// productos = [{ producto_id, cantidad }] · tarjeta = { numero, titular, vencimiento, cvv }
// Devuelve el comprobante: { id, fecha, total, tarjeta_ultimos4, estado, segundosParaListo, productos }
export const crearPedido = (token, productos, tarjeta) =>
  pedir('/pedidos', { metodo: 'POST', cuerpo: { productos, tarjeta }, token });

// HU-09 · Mis pedidos → GET /api/pedidos
// Devuelve [{ id, fecha, total, estado }] del más reciente al más antiguo
export const listarMisPedidos = (token) => pedir('/pedidos', { token });

// HU-08 / HU-09 · Detalle y comprobante → GET /api/pedidos/:id
export const obtenerPedido = (token, id) => pedir(`/pedidos/${id}`, { token });
