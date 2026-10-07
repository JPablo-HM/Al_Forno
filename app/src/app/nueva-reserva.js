// HU-10 · Nueva reserva
// Pantalla temporal: se reemplaza al construir la pantalla real.
import PantallaPendiente from '../components/PantallaPendiente';
import Boton from '../components/Boton';

export default function NuevaReserva() {
  return (
    <PantallaPendiente
      hu="HU-10"
      titulo="Nueva reserva"
      descripcion="Fecha (sin lunes, máximo 30 días), hora exacta con espacios disponibles (“Sin espacio” si ya hay 3), personas de 1 a 8, motivo y comentario."
    >
      <Boton texto="Confirmar reserva (ejemplo)" href="/reserva-confirmada/1" />
    </PantallaPendiente>
  );
}
