// =====================================================================
// PANTALLA · Detalle del pedido (admin)
// Ruta: /admin/pedido/[id]   ·   Historia: HU-16
// Quién la ve: solo el administrador
// Se llega desde: Pedidos entrantes → un pedido
// Lleva a: — 
//
// ESTADO: plantilla temporal. <PantallaPendiente> muestra qué hará la
// pantalla y los botones para seguir el flujo del mapa de navegación.
// CUANDO SE CONSTRUYA: productos, nota y datos del cliente, con un botón
// para avanzar el estado en orden. La base no permite saltarse estados.
// =====================================================================
import { useLocalSearchParams } from 'expo-router';
import PantallaPendiente from '../../../components/PantallaPendiente';

export default function DetallePedidoAdmin() {
  // Lee la parte variable de la ruta ([id] en el nombre del archivo).
  // Ej.: en /admin/pedido/15, id vale "15" (siempre llega como texto).
  const { id } = useLocalSearchParams();
  return (
    <PantallaPendiente
      hu="HU-16"
      titulo={`Detalle del pedido · ${id}`}
      descripcion="Productos, nota, cliente y botón para avanzar el estado en orden: Recibido → En preparación → Listo para recoger → Entregado."
    />
  );
}
