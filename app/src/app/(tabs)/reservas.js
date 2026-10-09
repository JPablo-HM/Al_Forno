// =====================================================================
// PANTALLA · Reservas (pestaña del cliente)
// Ruta: /reservas   ·   Historia: HU-10, HU-11
// Quién la ve: visitantes y clientes (no necesita sesión)
// Se llega desde: pestaña "Reservas" del menú inferior
// Lleva a: /nueva-reserva y /mis-reservas (las dos piden sesión)
//
// ESTADO: plantilla temporal. <PantallaPendiente> muestra qué hará la
// pantalla y los botones para seguir el flujo del mapa de navegación.
// CUANDO SE CONSTRUYA: explicará las reglas de reserva (máximo 3 por hora,
// de 1 a 8 personas) y dará acceso a reservar o a ver las reservas
// propias.
// =====================================================================
import PantallaPendiente from '../../components/PantallaPendiente';
import Boton from '../../components/Boton';

export default function Reservas() {
  return (
    <PantallaPendiente
      hu="HU-10 · HU-11"
      titulo="Reservas"
      descripcion="Reserva una mesa escogiendo día, hora y cantidad de personas, o revisa tus reservas."
    >
      {/* requiereSesion: si es un visitante sin sesión, el botón lo lleva a Iniciar sesión */}
      <Boton texto="Nueva reserva" href="/nueva-reserva" requiereSesion />
      <Boton texto="Mis reservas" href="/mis-reservas" requiereSesion variante="secundario" />
    </PantallaPendiente>
  );
}
