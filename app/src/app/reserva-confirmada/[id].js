// HU-10 · Reserva confirmada
// Pantalla temporal: se reemplaza al construir la pantalla real.
import { useLocalSearchParams } from 'expo-router';
import PantallaPendiente from '../../components/PantallaPendiente';
import Boton from '../../components/Boton';

export default function ReservaConfirmada() {
  const { id } = useLocalSearchParams();
  return (
    <PantallaPendiente
      hu="HU-10"
      titulo={`Reserva confirmada · ${id}`}
      descripcion="Resumen de la reserva con estado “Confirmada”."
    >
      <Boton texto="Ver mis reservas" href="/mis-reservas" />
      <Boton texto="Volver al inicio" href="/" variante="secundario" />
    </PantallaPendiente>
  );
}
