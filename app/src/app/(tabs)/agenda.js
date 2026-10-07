// HU-12 · Agenda
// Pantalla temporal: se reemplaza al construir la pantalla real.
import PantallaPendiente from '../../components/PantallaPendiente';
import Boton from '../../components/Boton';

export default function Agenda() {
  return (
    <PantallaPendiente
      hu="HU-12"
      titulo="Agenda"
      descripcion="Actividades fijas de la semana (entrada libre con consumo) y eventos especiales próximos con precio de entrada y espacios disponibles. Se ve sin iniciar sesión."
    >
      <Boton texto="Ver evento especial (ejemplo)" href="/eventos/1" />
    </PantallaPendiente>
  );
}
