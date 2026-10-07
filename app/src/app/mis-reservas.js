// HU-11 · Mis reservas
// Pantalla temporal: se reemplaza al construir la pantalla real.
import PantallaPendiente from '../components/PantallaPendiente';

export default function MisReservas() {
  return (
    <PantallaPendiente
      hu="HU-11"
      titulo="Mis reservas"
      descripcion="Reservas próximas con día, hora, personas, motivo y estado. Permite cancelar hasta 2 horas antes, pidiendo confirmación."
    />
  );
}
