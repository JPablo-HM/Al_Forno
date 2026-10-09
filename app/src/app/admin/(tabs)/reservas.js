// =====================================================================
// PANTALLA · Reservas del día (admin)
// Ruta: /admin/reservas   ·   Historia: HU-18
// Quién la ve: solo el administrador
// Se llega desde: pestaña "Reservas" del panel
// Lleva a: — 
//
// ESTADO: plantilla temporal. <PantallaPendiente> muestra qué hará la
// pantalla y los botones para seguir el flujo del mapa de navegación.
// CUANDO SE CONSTRUYA: reservas del día ordenadas por hora, espacios
// libres por hora y botones para marcar Asistió / No asistió o cancelar.
// =====================================================================
import PantallaPendiente from '../../../components/PantallaPendiente';

export default function ReservasDia() {
  return (
    <PantallaPendiente
      hu="HU-18"
      titulo="Reservas del día"
      descripcion="Reservas ordenadas por hora con cliente, teléfono, personas, motivo y comentario, y los espacios libres por hora. Permite marcar Asistió / No asistió y cancelar."
    />
  );
}
