// HU-16 · Pedidos entrantes
// Pantalla temporal: se reemplaza al construir la pantalla real.
import PantallaPendiente from '../../../components/PantallaPendiente';
import Boton from '../../../components/Boton';

export default function PedidosEntrantes() {
  return (
    <PantallaPendiente
      hu="HU-16"
      titulo="Pedidos entrantes"
      descripcion="Pedidos activos (Recibido, En preparación, Listo para recoger) del más antiguo al más reciente, con cliente, teléfono, productos, nota, total y hora."
    >
      <Boton texto="Ver pedido (ejemplo)" href="/admin/pedido/1" />
      <Boton texto="Historial de pedidos" href="/admin/historial-pedidos" variante="secundario" />
    </PantallaPendiente>
  );
}
