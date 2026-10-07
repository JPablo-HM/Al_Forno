// HU-13 · Mi ticket
// Pantalla temporal: se reemplaza al construir la pantalla real.
import { useLocalSearchParams } from 'expo-router';
import PantallaPendiente from '../../components/PantallaPendiente';

export default function MiTicket() {
  const { id } = useLocalSearchParams();
  return (
    <PantallaPendiente
      hu="HU-13"
      titulo={`Mi ticket · ${id}`}
      descripcion="Código del ticket y su código QR para presentarlo en la entrada."
    />
  );
}
