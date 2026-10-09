// =====================================================================
// PANTALLA · Pago de entradas
// Ruta: /comprar-entradas/[id]   ·   Historia: HU-13
// Quién la ve: solo clientes con sesión iniciada
// Se llega desde: Detalle de evento → "Comprar entradas"
// Lleva a: /mis-tickets/[id]
//
// ESTADO: plantilla temporal. <PantallaPendiente> muestra qué hará la
// pantalla y los botones para seguir el flujo del mapa de navegación.
// CUANDO SE CONSTRUYA: cantidad de 1 a 6 entradas y pago simulado con
// tarjeta. La base bloquea el cupo del evento para no vender de más.
// =====================================================================
import { useLocalSearchParams } from 'expo-router';
import PantallaPendiente from '../../components/PantallaPendiente';
import Boton from '../../components/Boton';

export default function ComprarEntradas() {
  // Lee la parte variable de la ruta ([id] en el nombre del archivo).
  // Ej.: en /comprar-entradas/15, id vale "15" (siempre llega como texto).
  const { id } = useLocalSearchParams();
  return (
    <PantallaPendiente
      hu="HU-13"
      titulo={`Pago de entradas · ${id}`}
      descripcion="Cantidad de 1 a 6 entradas sin pasar de los espacios disponibles y pago con tarjeta simulada."
    >
      <Boton texto="Pagar (simulado)" href="/mis-tickets/1" />
    </PantallaPendiente>
  );
}
