// =====================================================================
// PANTALLA · Mis reservas
// Ruta: /mis-reservas   ·   Historia: HU-11
// Quién la ve: solo clientes con sesión iniciada
// Se llega desde: Reservas o Perfil → "Mis reservas"
// Lleva a: — 
//
// ESTADO: plantilla temporal. <PantallaPendiente> muestra qué hará la
// pantalla y los botones para seguir el flujo del mapa de navegación.
// CUANDO SE CONSTRUYA: lista de reservas próximas con su estado; permitirá
// cancelar las confirmadas, pidiendo confirmación.
// =====================================================================
import PantallaPendiente from '../components/PantallaPendiente';

export default function MisReservas() {
  return (
    <PantallaPendiente
      hu="HU-11"
      titulo="Mis reservas"
      descripcion="Reservas próximas con día, hora, personas, motivo y estado. Permite cancelar una reserva confirmada, pidiendo confirmación."
    />
  );
}
