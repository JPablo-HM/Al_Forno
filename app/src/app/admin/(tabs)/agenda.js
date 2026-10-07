// HU-19 · Agenda y eventos
// Pantalla temporal: se reemplaza al construir la pantalla real.
import PantallaPendiente from '../../../components/PantallaPendiente';
import Boton from '../../../components/Boton';

export default function AgendaAdmin() {
  return (
    <PantallaPendiente
      hu="HU-19"
      titulo="Agenda y eventos"
      descripcion="Actividades fijas y eventos especiales con entradas vendidas y espacios disponibles."
    >
      <Boton texto="Nuevo evento" href="/admin/evento/nuevo" />
      <Boton texto="Nueva actividad" href="/admin/actividad/nuevo" variante="secundario" />
    </PantallaPendiente>
  );
}
