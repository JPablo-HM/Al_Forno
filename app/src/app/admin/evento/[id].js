// =====================================================================
// PANTALLA · Formulario de evento (admin)
// Ruta: /admin/evento/[id]   ·   Historia: HU-19
// Quién la ve: solo el administrador
// Se llega desde: Agenda y eventos
// Lleva a: — (vuelve a la lista al guardar)
//
// ESTADO: plantilla temporal. <PantallaPendiente> muestra qué hará la
// pantalla y los botones para seguir el flujo del mapa de navegación.
// CUANDO SE CONSTRUYA: si id es "nuevo" crea; si es un número, edita.
// Campos: fecha, hora, nombre, descripción, precio y cupo (no puede bajar
// de lo ya vendido).
// =====================================================================
import { useLocalSearchParams } from 'expo-router';
import PantallaPendiente from '../../../components/PantallaPendiente';

export default function FormularioEvento() {
  // Lee la parte variable de la ruta ([id] en el nombre del archivo).
  // Ej.: en /admin/evento/15, id vale "15" (siempre llega como texto).
  const { id } = useLocalSearchParams();
  return (
    <PantallaPendiente
      hu="HU-19"
      titulo={`Formulario de evento · ${id}`}
      descripcion="Fecha, hora, nombre, descripción, precio de entrada y cupo total. El cupo no puede bajar de las entradas vendidas."
    />
  );
}
