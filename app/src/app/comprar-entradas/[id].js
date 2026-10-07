// HU-13 · Pago de entradas
// Pantalla temporal: se reemplaza al construir la pantalla real.
import { useLocalSearchParams } from 'expo-router';
import PantallaPendiente from '../../components/PantallaPendiente';
import Boton from '../../components/Boton';

export default function ComprarEntradas() {
  const { id } = useLocalSearchParams();
  return (
    <PantallaPendiente
      hu="HU-13"
      titulo={`Pago de entradas · ${id}`}
      descripcion="Cantidad de 1 a 6 entradas sin pasar de los espacios disponibles y pago con tarjeta simulada."
    >
      <Boton texto="Pagar (simulado)" href="/mis-tickets/1" />
    </PantallaPendiente>
  );
}
