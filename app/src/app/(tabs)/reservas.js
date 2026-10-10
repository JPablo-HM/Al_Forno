// =====================================================================
// PANTALLA · Reservas (pestaña del cliente)
// Ruta: /reservas   ·   Historia: HU-10, HU-11
// Quién la ve: todos; el contenido depende de la sesión
// Se llega desde: pestaña "Reservas" del menú inferior; Perfil → "Mis reservas"
// Lleva a: /nueva-reserva (pide sesión)
//
// Esta pestaña ES "Mis reservas": muestra las reservas del cliente y el
// botón para hacer una nueva. A un visitante sin sesión le pide iniciar
// sesión (HU-10 y HU-11 piden sesión).
//
// ESTADO: plantilla temporal. <PantallaPendiente> muestra qué hará la
// pantalla y los botones para seguir el flujo del mapa de navegación.
// CUANDO SE CONSTRUYA: reservas de hoy en adelante con día, hora,
// personas, motivo y estado; botón "Cancelar" en las confirmadas, pidiendo
// confirmación (HU-11).
// =====================================================================
import PantallaPendiente from '../../components/PantallaPendiente';
import Boton from '../../components/Boton';
import { useSesion } from '../../context/SesionContext';

export default function Reservas() {
  const { usuario } = useSesion();

  // Visitante sin sesión
  if (!usuario) {
    return (
      <PantallaPendiente
        hu="HU-10 · HU-11"
        titulo="Reservas"
        descripcion="Inicia sesión para reservar una mesa y ver tus reservas."
      >
        <Boton texto="Iniciar sesión" href="/login" />
      </PantallaPendiente>
    );
  }

  // Cliente con sesión: sus reservas + nueva reserva
  return (
    <PantallaPendiente
      hu="HU-10 · HU-11"
      titulo="Mis reservas"
      descripcion="Reservas de hoy en adelante con día, hora, personas, motivo y estado. Permite cancelar una reserva confirmada, pidiendo confirmación."
    >
      <Boton texto="Nueva reserva" href="/nueva-reserva" />
    </PantallaPendiente>
  );
}
