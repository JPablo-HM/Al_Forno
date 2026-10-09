// =====================================================================
// PANTALLA · Formulario de actividad (admin)
// Ruta: /admin/actividad/[id]   ·   Historia: HU-19
// Quién la ve: solo el administrador
// Se llega desde: Agenda y eventos
// Lleva a: — (vuelve a la lista al guardar)
//
// ESTADO: plantilla temporal. <PantallaPendiente> muestra qué hará la
// pantalla y los botones para seguir el flujo del mapa de navegación.
// CUANDO SE CONSTRUYA: si id es "nuevo" crea; si es un número, edita.
// Campos: día de la semana, hora, nombre y descripción.
// =====================================================================
import { useLocalSearchParams } from 'expo-router';
import PantallaPendiente from '../../../components/PantallaPendiente';

export default function FormularioActividad() {
  // Lee la parte variable de la ruta ([id] en el nombre del archivo).
  // Ej.: en /admin/actividad/15, id vale "15" (siempre llega como texto).
  const { id } = useLocalSearchParams();
  return (
    <PantallaPendiente
      hu="HU-19"
      titulo={`Formulario de actividad · ${id}`}
      descripcion="Día de la semana, hora, nombre y descripción de una actividad fija."
    />
  );
}
