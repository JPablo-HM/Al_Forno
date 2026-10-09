// =====================================================================
// PANTALLA · Mi ticket
// Ruta: /mis-tickets/[id]   ·   Historia: HU-13
// Quién la ve: solo clientes con sesión iniciada
// Se llega desde: Mis tickets o la compra de entradas
// Lleva a: — 
//
// ESTADO: plantilla temporal. <PantallaPendiente> muestra qué hará la
// pantalla y los botones para seguir el flujo del mapa de navegación.
// CUANDO SE CONSTRUYA: mostrará el código del ticket (AF-XXXXXXXX) como
// código QR para presentarlo en la entrada.
// =====================================================================
import { useLocalSearchParams } from 'expo-router';
import PantallaPendiente from '../../components/PantallaPendiente';

export default function MiTicket() {
  // Lee la parte variable de la ruta ([id] en el nombre del archivo).
  // Ej.: en /mis-tickets/15, id vale "15" (siempre llega como texto).
  const { id } = useLocalSearchParams();
  return (
    <PantallaPendiente
      hu="HU-13"
      titulo={`Mi ticket · ${id}`}
      descripcion="Código del ticket y su código QR para presentarlo en la entrada."
    />
  );
}
