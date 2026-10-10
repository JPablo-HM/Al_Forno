// =====================================================================
// PANTALLA · Pedido: estado, detalle y comprobante
// Ruta: /mis-pedidos/[id]   ·   Historia: HU-08, HU-09
// Quién la ve: solo clientes con sesión iniciada
// Se llega desde: Mis pedidos, o desde Pago al aprobarse el pago
// Lleva a: — 
//
// ESTADO: plantilla temporal. <PantallaPendiente> muestra qué hará la
// pantalla y los botones para seguir el flujo del mapa de navegación.
// CUANDO SE CONSTRUYA: mostrará el estado (Recibido → En preparación →
// Listo para recoger → Entregado) y el comprobante en la misma pantalla:
// número de pedido, fecha y hora, productos, total y últimos 4 dígitos de
// la tarjeta (HU-08: no es factura electrónica). Se actualiza al refrescar.
// =====================================================================
import { useLocalSearchParams } from 'expo-router';
import PantallaPendiente from '../../components/PantallaPendiente';

export default function EstadoPedido() {
  // Lee la parte variable de la ruta ([id] en el nombre del archivo).
  // Ej.: en /mis-pedidos/15, id vale "15" (siempre llega como texto).
  const { id } = useLocalSearchParams();
  return (
    <PantallaPendiente
      hu="HU-09"
      titulo={`Pedido #${id}`}
      descripcion="Estado (Recibido, En preparación, Listo para recoger, Entregado) y comprobante: número, fecha y hora, productos, total y últimos 4 dígitos de la tarjeta."
    />
  );
}
