// =====================================================================
// PANTALLA · Nueva reserva
// Ruta: /nueva-reserva   ·   Historia: HU-10
// Quién la ve: solo clientes con sesión iniciada
// Se llega desde: pestaña Reservas → "Nueva reserva"
// Lleva a: vuelve a la pestaña Reservas al confirmar
//
// ESTADO: plantilla temporal. <PantallaPendiente> muestra qué hará la
// pantalla y los botones para seguir el flujo del mapa de navegación.
// CUANDO SE CONSTRUYA: formulario de fecha (sin lunes, máximo 30 días),
// hora exacta con espacios libres, personas de 1 a 8, motivo y comentario.
// Enviará la reserva a la API; si la hora ya tiene 3 reservas, la base
// responde "Sin espacio". Al confirmar muestra el resumen de la reserva
// (HU-10) y vuelve a Reservas, donde aparece con estado "Confirmada".
// =====================================================================
import { useRouter } from 'expo-router';
import PantallaPendiente from '../components/PantallaPendiente';
import Boton from '../components/Boton';

export default function NuevaReserva() {
  const router = useRouter();
  return (
    <PantallaPendiente
      hu="HU-10"
      titulo="Nueva reserva"
      descripcion="Fecha (sin lunes, máximo 30 días), hora exacta con espacios disponibles (“Sin espacio” si ya hay 3), personas de 1 a 8, motivo y comentario. Al confirmar, muestra el resumen y vuelve a Reservas."
    >
      {/* router.back() regresa a la pantalla anterior: la pestaña Reservas */}
      <Boton texto="Confirmar reserva (ejemplo)" onPress={() => router.back()} />
    </PantallaPendiente>
  );
}
