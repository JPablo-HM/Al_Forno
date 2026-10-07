// HU-15 · Formulario de producto
// Pantalla temporal: se reemplaza al construir la pantalla real.
import { useLocalSearchParams } from 'expo-router';
import PantallaPendiente from '../../../components/PantallaPendiente';

export default function FormularioProducto() {
  const { id } = useLocalSearchParams();
  return (
    <PantallaPendiente
      hu="HU-15"
      titulo={`Formulario de producto · ${id}`}
      descripcion="Nombre, descripción, categoría y precio (entero mayor a cero). Con id “nuevo” crea; con un número edita."
    />
  );
}
