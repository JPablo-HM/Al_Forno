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
// libres por hora y botón para cancelar las confirmadas.
// =====================================================================
import PantallaPendiente from '../../../components/PantallaPendiente';

export default function ReservasDia() {
  return (
    <PantallaPendiente
      hu="HU-18"
      titulo="Reservas del día"
      descripcion="Reservas ordenadas por hora con cliente, teléfono, personas, motivo y comentario, y los espacios libres por hora. Permite cancelar una reserva confirmada (el cliente la ve como “Cancelada”)."
    />
  );
}
