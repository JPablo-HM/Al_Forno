// HU-15 · Lista de productos
// Pantalla temporal: se reemplaza al construir la pantalla real.
import PantallaPendiente from '../../../components/PantallaPendiente';
import Boton from '../../../components/Boton';

export default function ListaProductos() {
  return (
    <PantallaPendiente
      hu="HU-15"
      titulo="Lista de productos"
      descripcion="Productos por categoría. Permite marcar “Agotado”, editar y eliminar (desactivar)."
    >
      <Boton texto="Nuevo producto" href="/admin/producto/nuevo" />
      <Boton texto="Editar producto (ejemplo)" href="/admin/producto/1" variante="secundario" />
    </PantallaPendiente>
  );
}
