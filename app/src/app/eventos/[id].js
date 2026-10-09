// =====================================================================
// PANTALLA · Detalle de evento especial
// Ruta: /eventos/[id]   ·   Historia: HU-12, HU-13
// Quién la ve: visitantes y clientes (no necesita sesión)
// Se llega desde: Agenda → un evento
// Lleva a: /comprar-entradas/[id] (pide sesión)
//
// ESTADO: plantilla temporal. <PantallaPendiente> muestra qué hará la
// pantalla y los botones para seguir el flujo del mapa de navegación.
// CUANDO SE CONSTRUYA: mostrará fecha, hora, descripción, precio y
// espacios disponibles; si no quedan espacios dirá "Agotado".
// =====================================================================
import { useLocalSearchParams } from 'expo-router';
import PantallaPendiente from '../../components/PantallaPendiente';
import Boton from '../../components/Boton';

export default function DetalleEvento() {
  // Lee la parte variable de la ruta ([id] en el nombre del archivo).
  // Ej.: en /eventos/15, id vale "15" (siempre llega como texto).
  const { id } = useLocalSearchParams();
  return (
    <PantallaPendiente
      hu="HU-13"
      titulo={`Evento especial · ${id}`}
      descripcion="Fecha, hora, descripción, precio de entrada y espacios disponibles. Si está agotado muestra “Agotado”."
    >
      {/* requiereSesion: si es un visitante sin sesión, el botón lo lleva a Iniciar sesión */}
      <Boton texto="Comprar entradas" href={`/comprar-entradas/${id}`} requiereSesion />
    </PantallaPendiente>
  );
}
