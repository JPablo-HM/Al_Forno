// =====================================================================
// PANTALLA · Formulario de agenda (admin)
// Ruta: /admin/agenda/[id]   ·   Historia: HU-19
// Quién la ve: solo el administrador
// Se llega desde: Agenda (pestaña del panel)
// Lleva a: — (vuelve a la lista al guardar)
//
// Actividades fijas y eventos especiales usan el MISMO formulario: la
// única diferencia es el precio de entrada.
//   · Precio vacío → "Entrada gratuita"
//   · Con precio   → "Cover", el cliente compra el ticket en la app
// El día, la fecha y la hora se escriben en la descripción.
//
// ESTADO: plantilla temporal. <PantallaPendiente> muestra qué hará la
// pantalla y los botones para seguir el flujo del mapa de navegación.
// CUANDO SE CONSTRUYA: si id es "nuevo" crea; si es un número, edita.
// Campos: nombre, descripción y precio de entrada (opcional).
// =====================================================================
import { useLocalSearchParams } from 'expo-router';
import PantallaPendiente from '../../../components/PantallaPendiente';

export default function FormularioAgenda() {
  // Lee la parte variable de la ruta ([id] en el nombre del archivo).
  // Ej.: en /admin/agenda/15, id vale "15" (siempre llega como texto).
  const { id } = useLocalSearchParams();
  return (
    <PantallaPendiente
      hu="HU-19"
      titulo={id === 'nuevo' ? 'Nueva actividad o evento' : `Editar agenda · ${id}`}
      descripcion="Nombre, descripción (con el día, la fecha y la hora escritos) y precio de entrada. Si el precio queda vacío, es entrada gratuita; si tiene precio, es cover y el cliente compra el ticket en la app."
    />
  );
}
