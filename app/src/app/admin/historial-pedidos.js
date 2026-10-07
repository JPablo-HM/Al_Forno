// HU-16 · Historial de pedidos
// Pantalla temporal: se reemplaza al construir la pantalla real.
import PantallaPendiente from '../../components/PantallaPendiente';

export default function HistorialPedidos() {
  return (
    <PantallaPendiente
      hu="HU-16"
      titulo="Historial de pedidos"
      descripcion="Pedidos entregados y anteriores, con filtro por estado y fecha."
    />
  );
}
