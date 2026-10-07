// HU-18 · Reservas del día
// Pantalla temporal: se reemplaza al construir la pantalla real.
import PantallaPendiente from '../../../components/PantallaPendiente';

export default function ReservasDia() {
  return (
    <PantallaPendiente
      hu="HU-18"
      titulo="Reservas del día"
      descripcion="Reservas ordenadas por hora con cliente, teléfono, personas, motivo y comentario, y los espacios libres por hora. Permite marcar Asistió / No asistió y cancelar."
    />
  );
}
