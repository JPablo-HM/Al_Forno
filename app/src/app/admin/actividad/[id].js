// HU-19 · Formulario de actividad
// Pantalla temporal: se reemplaza al construir la pantalla real.
import { useLocalSearchParams } from 'expo-router';
import PantallaPendiente from '../../../components/PantallaPendiente';

export default function FormularioActividad() {
  const { id } = useLocalSearchParams();
  return (
    <PantallaPendiente
      hu="HU-19"
      titulo={`Formulario de actividad · ${id}`}
      descripcion="Día de la semana, hora, nombre y descripción de una actividad fija."
    />
  );
}
