// HU-13 · Evento especial
// Pantalla temporal: se reemplaza al construir la pantalla real.
import { useLocalSearchParams } from 'expo-router';
import PantallaPendiente from '../../components/PantallaPendiente';
import Boton from '../../components/Boton';

export default function DetalleEvento() {
  const { id } = useLocalSearchParams();
  return (
    <PantallaPendiente
      hu="HU-13"
      titulo={`Evento especial · ${id}`}
      descripcion="Fecha, hora, descripción, precio de entrada y espacios disponibles. Si está agotado muestra “Agotado”."
    >
      <Boton texto="Comprar entradas" href={`/comprar-entradas/${id}`} requiereSesion />
    </PantallaPendiente>
  );
}
