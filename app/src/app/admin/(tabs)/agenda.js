// =====================================================================
// PANTALLA · Agenda y eventos (admin)
// Ruta: /admin/agenda   ·   Historia: HU-19
// Quién la ve: solo el administrador
// Se llega desde: pestaña "Agenda" del panel
// Lleva a: /admin/evento/[id] y /admin/actividad/[id] ("nuevo" para crear)
//
// ESTADO: plantilla temporal. <PantallaPendiente> muestra qué hará la
// pantalla y los botones para seguir el flujo del mapa de navegación.
// CUANDO SE CONSTRUYA: lista de actividades fijas y eventos especiales con
// entradas vendidas y espacios disponibles.
// =====================================================================
import PantallaPendiente from '../../../components/PantallaPendiente';
import Boton from '../../../components/Boton';

export default function AgendaAdmin() {
  return (
    <PantallaPendiente
      hu="HU-19"
      titulo="Agenda y eventos"
      descripcion="Actividades fijas y eventos especiales con entradas vendidas y espacios disponibles."
    >
      <Boton texto="Nuevo evento" href="/admin/evento/nuevo" />
      <Boton texto="Nueva actividad" href="/admin/actividad/nuevo" variante="secundario" />
    </PantallaPendiente>
  );
}
