// =====================================================================
// PANTALLA · Formulario de producto (admin)
// Ruta: /admin/producto/[id]   ·   Historia: HU-15
// Quién la ve: solo el administrador
// Se llega desde: Lista de productos
// Lleva a: — (vuelve a la lista al guardar)
//
// ESTADO: plantilla temporal. <PantallaPendiente> muestra qué hará la
// pantalla y los botones para seguir el flujo del mapa de navegación.
// CUANDO SE CONSTRUYA: si id es "nuevo" crea un producto; si es un número,
// lo edita. Campos: nombre, descripción, categoría y precio entero mayor a
// cero.
// =====================================================================
import { useLocalSearchParams } from 'expo-router';
import PantallaPendiente from '../../../components/PantallaPendiente';

export default function FormularioProducto() {
  // Lee la parte variable de la ruta ([id] en el nombre del archivo).
  // Ej.: en /admin/producto/15, id vale "15" (siempre llega como texto).
  const { id } = useLocalSearchParams();
  return (
    <PantallaPendiente
      hu="HU-15"
      titulo={`Formulario de producto · ${id}`}
      descripcion="Nombre, descripción, categoría y precio (entero mayor a cero). Con id “nuevo” crea; con un número edita."
    />
  );
}
