// =====================================================================
// PANTALLA · Agenda (pestaña del cliente)
// Ruta: /agenda   ·   Historia: HU-12
// Quién la ve: visitantes y clientes (no necesita sesión)
// Se llega desde: pestaña "Agenda" del menú inferior
// Lleva a: /eventos/[id]
//
// ESTADO: plantilla temporal. <PantallaPendiente> muestra qué hará la
// pantalla y los botones para seguir el flujo del mapa de navegación.
// CUANDO SE CONSTRUYA: pedirá la agenda a la API (GET /api/agenda):
// actividades fijas de la semana y eventos especiales con precio y
// espacios disponibles.
// =====================================================================
import PantallaPendiente from '../../components/PantallaPendiente';
import Boton from '../../components/Boton';

export default function Agenda() {
  return (
    <PantallaPendiente
      hu="HU-12"
      titulo="Agenda"
      descripcion="Actividades fijas de la semana (entrada libre con consumo) y eventos especiales próximos con precio de entrada y espacios disponibles. Se ve sin iniciar sesión."
    >
      <Boton texto="Ver evento especial (ejemplo)" href="/eventos/1" />
    </PantallaPendiente>
  );
}
