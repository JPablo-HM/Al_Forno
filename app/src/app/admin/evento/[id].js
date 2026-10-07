// HU-19 · Formulario de evento
// Pantalla temporal: se reemplaza al construir la pantalla real.
import { useLocalSearchParams } from 'expo-router';
import PantallaPendiente from '../../../components/PantallaPendiente';

export default function FormularioEvento() {
  const { id } = useLocalSearchParams();
  return (
    <PantallaPendiente
      hu="HU-19"
      titulo={`Formulario de evento · ${id}`}
      descripcion="Fecha, hora, nombre, descripción, precio de entrada y cupo total. El cupo no puede bajar de las entradas vendidas."
    />
  );
}
