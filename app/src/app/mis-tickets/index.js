// HU-13 · Mis tickets
// Pantalla temporal: se reemplaza al construir la pantalla real.
import PantallaPendiente from '../../components/PantallaPendiente';
import Boton from '../../components/Boton';

export default function MisTickets() {
  return (
    <PantallaPendiente
      hu="HU-13"
      titulo="Mis tickets"
      descripcion="Tickets con evento, fecha, cantidad de entradas, código y estado (Válido o Usado)."
    >
      <Boton texto="Ver ticket (ejemplo)" href="/mis-tickets/1" />
    </PantallaPendiente>
  );
}
