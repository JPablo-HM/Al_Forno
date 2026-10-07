// HU-10 · HU-11 · Reservas
// Pantalla temporal: se reemplaza al construir la pantalla real.
import PantallaPendiente from '../../components/PantallaPendiente';
import Boton from '../../components/Boton';

export default function Reservas() {
  return (
    <PantallaPendiente
      hu="HU-10 · HU-11"
      titulo="Reservas"
      descripcion="Reserva una mesa escogiendo día, hora y cantidad de personas, o revisa tus reservas."
    >
      <Boton texto="Nueva reserva" href="/nueva-reserva" requiereSesion />
      <Boton texto="Mis reservas" href="/mis-reservas" requiereSesion variante="secundario" />
    </PantallaPendiente>
  );
}
