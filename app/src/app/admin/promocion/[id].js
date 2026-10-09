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
// Campos: título y descripción (los días y las fechas se escriben en la
// descripción, ej. "Válido los martes hasta el 31 de octubre").
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
      descripcion="Título y descripción. Los días y las fechas de la promoción se escriben en la descripción."
    />
  );
}
