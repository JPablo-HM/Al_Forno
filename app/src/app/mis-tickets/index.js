// =====================================================================
// PANTALLA · Mis tickets
// Ruta: /mis-tickets   ·   Historia: HU-13
// Quién la ve: solo clientes con sesión iniciada
// Se llega desde: Perfil → "Mis tickets"
// Lleva a: /mis-tickets/[id]
//
// ESTADO: plantilla temporal. <PantallaPendiente> muestra qué hará la
// pantalla y los botones para seguir el flujo del mapa de navegación.
// CUANDO SE CONSTRUYA: lista de tickets comprados con evento, cantidad,
// total y código.
// =====================================================================
import PantallaPendiente from '../../components/PantallaPendiente';
import Boton from '../../components/Boton';

export default function MisTickets() {
  return (
    <PantallaPendiente
      hu="HU-13"
      titulo="Mis tickets"
      descripcion="Tickets comprados con evento, cantidad de entradas, total y código."
    >
      <Boton texto="Ver ticket (ejemplo)" href="/mis-tickets/1" />
    </PantallaPendiente>
  );
}
