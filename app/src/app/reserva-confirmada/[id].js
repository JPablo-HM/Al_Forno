// =====================================================================
// PANTALLA · Reserva confirmada
// Ruta: /reserva-confirmada/[id]   ·   Historia: HU-10
// Quién la ve: solo clientes con sesión iniciada
// Se llega desde: Nueva reserva (no tiene flecha "atrás")
// Lleva a: /mis-reservas y / (Inicio)
//
// ESTADO: plantilla temporal. <PantallaPendiente> muestra qué hará la
// pantalla y los botones para seguir el flujo del mapa de navegación.
// CUANDO SE CONSTRUYA: mostrará el resumen de la reserva creada con estado
// "Confirmada".
// =====================================================================
import { useLocalSearchParams } from 'expo-router';
import PantallaPendiente from '../../components/PantallaPendiente';
import Boton from '../../components/Boton';

export default function ReservaConfirmada() {
  // Lee la parte variable de la ruta ([id] en el nombre del archivo).
  // Ej.: en /reserva-confirmada/15, id vale "15" (siempre llega como texto).
  const { id } = useLocalSearchParams();
  return (
    <PantallaPendiente
      hu="HU-10"
      titulo={`Reserva confirmada · ${id}`}
      descripcion="Resumen de la reserva con estado “Confirmada”."
    >
      <Boton texto="Ver mis reservas" href="/mis-reservas" />
      <Boton texto="Volver al inicio" href="/" variante="secundario" />
    </PantallaPendiente>
  );
}
