// HU-09 · Mis pedidos
// Pantalla temporal: se reemplaza al construir la pantalla real.
import PantallaPendiente from '../../components/PantallaPendiente';
import Boton from '../../components/Boton';

export default function MisPedidos() {
  return (
    <PantallaPendiente
      hu="HU-09"
      titulo="Mis pedidos"
      descripcion="Pedidos del más reciente al más antiguo con número, fecha, total y estado. Se actualiza al refrescar."
    >
      <Boton texto="Ver pedido (ejemplo)" href="/mis-pedidos/1" />
    </PantallaPendiente>
  );
}
