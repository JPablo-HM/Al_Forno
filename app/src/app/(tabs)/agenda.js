// =====================================================================
// PANTALLA · Agenda (pestaña del cliente)
// Ruta: /agenda   ·   Historia: HU-12
// Quién la ve: visitantes y clientes (no necesita sesión)
// Se llega desde: pestaña "Agenda" del menú inferior
// Lleva a: /eventos/[id]
//
// ESTADO: plantilla temporal. <PantallaPendiente> muestra qué hará la
// pantalla y los botones para seguir el flujo del mapa de navegación.
// CUANDO SE CONSTRUYA: pedirá la agenda a la API (GET /api/agenda): una
// sola lista con actividades y eventos. Cada uno muestra "Entrada
// gratuita" o "Cover: ₡…"; los que tienen cover permiten comprar ticket.
// =====================================================================
import PantallaPendiente from '../../components/PantallaPendiente';
import Boton from '../../components/Boton';

export default function Agenda() {
  return (
    <PantallaPendiente
      hu="HU-12"
      titulo="Agenda"
      descripcion="Actividades y eventos en una sola lista, con nombre y descripción (día, fecha y hora escritos). Cada uno indica “Entrada gratuita” o “Cover: ₡…”. Se ve sin iniciar sesión."
    >
      <Boton texto="Ver evento con cover (ejemplo)" href="/eventos/7" />
    </PantallaPendiente>
  );
}
