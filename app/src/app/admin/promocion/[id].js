// HU-17 · Formulario de promoción
// Pantalla temporal: se reemplaza al construir la pantalla real.
import { useLocalSearchParams } from 'expo-router';
import PantallaPendiente from '../../../components/PantallaPendiente';

export default function FormularioPromocion() {
  const { id } = useLocalSearchParams();
  return (
    <PantallaPendiente
      hu="HU-17"
      titulo={`Formulario de promoción · ${id}`}
      descripcion="Título, descripción, días válidos, fecha de inicio y fecha de fin (no anterior al inicio)."
    />
  );
}
