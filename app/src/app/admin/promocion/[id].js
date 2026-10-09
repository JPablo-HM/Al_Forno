// =====================================================================
// PANTALLA · Formulario de promoción (admin)
// Ruta: /admin/promocion/[id]   ·   Historia: HU-17
// Quién la ve: solo el administrador
// Se llega desde: Promociones
// Lleva a: — (vuelve a la lista al guardar)
//
// ESTADO: plantilla temporal. <PantallaPendiente> muestra qué hará la
// pantalla y los botones para seguir el flujo del mapa de navegación.
// CUANDO SE CONSTRUYA: si id es "nuevo" crea; si es un número, edita.
// Campos: título, descripción, días válidos, fecha de inicio y de fin.
// =====================================================================
import { useLocalSearchParams } from 'expo-router';
import PantallaPendiente from '../../../components/PantallaPendiente';

export default function FormularioPromocion() {
  // Lee la parte variable de la ruta ([id] en el nombre del archivo).
  // Ej.: en /admin/promocion/15, id vale "15" (siempre llega como texto).
  const { id } = useLocalSearchParams();
  return (
    <PantallaPendiente
      hu="HU-17"
      titulo={`Formulario de promoción · ${id}`}
      descripcion="Título, descripción, días válidos, fecha de inicio y fecha de fin (no anterior al inicio)."
    />
  );
}
