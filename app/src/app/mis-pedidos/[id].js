// =====================================================================
// PANTALLA · Estado del pedido
// Ruta: /mis-pedidos/[id]   ·   Historia: HU-09
// Quién la ve: solo clientes con sesión iniciada
// Se llega desde: Mis pedidos o el comprobante
// Lleva a: — 
//
// ESTADO: plantilla temporal. <PantallaPendiente> muestra qué hará la
// pantalla y los botones para seguir el flujo del mapa de navegación.
// CUANDO SE CONSTRUYA: mostrará el estado (Recibido → En preparación →
// Listo para recoger → Entregado), los productos y el comprobante. Se
// actualizará al refrescar.
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
      titulo={`Estado del pedido · ${id}`}
      descripcion="Estado (Recibido, En preparación, Listo para recoger, Entregado), detalle y comprobante del pedido."
    />
  );
}
