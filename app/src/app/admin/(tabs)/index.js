// =====================================================================
// PANTALLA · Pedidos entrantes (admin)
// Ruta: /admin   ·   Historia: HU-16
// Quién la ve: solo el administrador
// Se llega desde: es la primera pantalla del administrador al iniciar sesión; pestaña "Pedidos"
// Lleva a: /admin/pedido/[id] y /admin/historial-pedidos
//
// ESTADO: plantilla temporal. <PantallaPendiente> muestra qué hará la
// pantalla y los botones para seguir el flujo del mapa de navegación.
// CUANDO SE CONSTRUYA: lista de pedidos activos (Recibido, En preparación,
// Listo) del más antiguo al más reciente, con cliente, teléfono,
// productos, nota y total.
// =====================================================================
import PantallaPendiente from '../../../components/PantallaPendiente';
import Boton from '../../../components/Boton';

export default function PedidosEntrantes() {
  return (
    <PantallaPendiente
      hu="HU-16"
      titulo="Pedidos entrantes"
      descripcion="Pedidos activos (Recibido, En preparación, Listo para recoger) del más antiguo al más reciente, con cliente, teléfono, productos, nota, total y hora."
    >
      <Boton texto="Ver pedido (ejemplo)" href="/admin/pedido/1" />
      <Boton texto="Historial de pedidos" href="/admin/historial-pedidos" variante="secundario" />
    </PantallaPendiente>
  );
}
