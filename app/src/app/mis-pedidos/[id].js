// HU-09 · Estado del pedido
// Pantalla temporal: se reemplaza al construir la pantalla real.
import { useLocalSearchParams } from 'expo-router';
import PantallaPendiente from '../../components/PantallaPendiente';

export default function EstadoPedido() {
  const { id } = useLocalSearchParams();
  return (
    <PantallaPendiente
      hu="HU-09"
      titulo={`Estado del pedido · ${id}`}
      descripcion="Estado (Recibido, En preparación, Listo para recoger, Entregado), detalle y comprobante del pedido."
    />
  );
}
