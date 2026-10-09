// =====================================================================
// PANTALLA · Detalle de evento (agenda)
// Ruta: /eventos/[id]   ·   Historia: HU-12, HU-13
// Quién la ve: visitantes y clientes (no necesita sesión)
// Se llega desde: Agenda → un evento
// Lleva a: /comprar-entradas/[id] (pide sesión)
//
// ESTADO: plantilla temporal. <PantallaPendiente> muestra qué hará la
// pantalla y los botones para seguir el flujo del mapa de navegación.
// CUANDO SE CONSTRUYA: mostrará nombre, descripción (día, fecha y hora
// escritos) y "Entrada gratuita" o "Cover: ₡…". El botón "Comprar
// entradas" solo aparece si el evento tiene cover.
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
      titulo={`Evento · ${id}`}
      descripcion="Nombre, descripción (con el día, la fecha y la hora) y “Entrada gratuita” o “Cover: ₡…”. Si tiene cover, permite comprar entradas."
    >
      {/* requiereSesion: si es un visitante sin sesión, el botón lo lleva a Iniciar sesión */}
      <Boton texto="Comprar entradas" href={`/comprar-entradas/${id}`} requiereSesion />
    </PantallaPendiente>
  );
}
