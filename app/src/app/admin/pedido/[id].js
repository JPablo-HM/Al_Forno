// HU-16 · Detalle del pedido
// Pantalla temporal: se reemplaza al construir la pantalla real.
import { useLocalSearchParams } from 'expo-router';
import PantallaPendiente from '../../../components/PantallaPendiente';

export default function DetallePedidoAdmin() {
  const { id } = useLocalSearchParams();
  return (
    <PantallaPendiente
      hu="HU-16"
      titulo={`Detalle del pedido · ${id}`}
      descripcion="Productos, nota, cliente y botón para avanzar el estado en orden: Recibido → En preparación → Listo para recoger → Entregado."
    />
  );
}
