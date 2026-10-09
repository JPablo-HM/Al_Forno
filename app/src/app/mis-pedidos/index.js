// =====================================================================
// PANTALLA · Mis pedidos
// Ruta: /mis-pedidos   ·   Historia: HU-09
// Quién la ve: solo clientes con sesión iniciada
// Se llega desde: Perfil → "Mis pedidos"
// Lleva a: /mis-pedidos/[id]
//
// ESTADO: plantilla temporal. <PantallaPendiente> muestra qué hará la
// pantalla y los botones para seguir el flujo del mapa de navegación.
// CUANDO SE CONSTRUYA: lista de pedidos del cliente, del más reciente al
// más antiguo, con número, fecha, total y estado (GET /api/pedidos/mios).
// =====================================================================
import PantallaPendiente from '../../components/PantallaPendiente';
import Boton from '../../components/Boton';

export default function MisPedidos() {
  return (
    <PantallaPendiente
      hu="HU-09"
      titulo="Mis pedidos"
      descripcion="Pedidos del más reciente al más antiguo con número, fecha, total y estado. Se actualiza al refrescar."
    >
      <Boton texto="Ver pedido (ejemplo)" href="/mis-pedidos/1" />
    </PantallaPendiente>
  );
}
