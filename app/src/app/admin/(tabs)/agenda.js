// =====================================================================
// PANTALLA · Agenda (admin)
// Ruta: /admin/agenda   ·   Historia: HU-19
// Quién la ve: solo el administrador
// Se llega desde: pestaña "Agenda" del panel
// Lleva a: /admin/agenda/[id] ("nuevo" para crear)
//
// ESTADO: plantilla temporal. <PantallaPendiente> muestra qué hará la
// pantalla y los botones para seguir el flujo del mapa de navegación.
// CUANDO SE CONSTRUYA: una sola lista con las actividades y los eventos
// (activos y desactivados), cada uno con "Entrada gratuita" o "Cover: ₡…".
// Permite crear, editar y activar/desactivar.
// =====================================================================
import PantallaPendiente from '../../../components/PantallaPendiente';
import Boton from '../../../components/Boton';

export default function AgendaAdmin() {
  return (
    <PantallaPendiente
      hu="HU-19"
      titulo="Agenda"
      descripcion="Actividades y eventos en una sola lista, cada uno con “Entrada gratuita” o “Cover: ₡…”. Permite crear, editar y activar/desactivar."
    >
      <Boton texto="Nuevo (actividad o evento)" href="/admin/agenda/nuevo" />
      <Boton texto="Editar (ejemplo)" href="/admin/agenda/1" variante="secundario" />
    </PantallaPendiente>
  );
}
