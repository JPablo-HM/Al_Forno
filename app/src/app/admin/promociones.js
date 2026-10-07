// HU-17 · Promociones
// Pantalla temporal: se reemplaza al construir la pantalla real.
import PantallaPendiente from '../../components/PantallaPendiente';
import Boton from '../../components/Boton';

export default function ListaPromociones() {
  return (
    <PantallaPendiente
      hu="HU-17"
      titulo="Promociones"
      descripcion="Todas las promociones, con su vigencia y si están activas."
    >
      <Boton texto="Nueva promoción" href="/admin/promocion/nuevo" />
    </PantallaPendiente>
  );
}
