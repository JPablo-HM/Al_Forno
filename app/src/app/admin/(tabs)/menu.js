// =====================================================================
// PANTALLA · Lista de productos (admin)
// Ruta: /admin/menu   ·   Historia: HU-15
// Quién la ve: solo el administrador
// Se llega desde: pestaña "Menú" del panel
// Lleva a: /admin/producto/nuevo (crear) y /admin/producto/[id] (editar)
//
// ESTADO: plantilla temporal. <PantallaPendiente> muestra qué hará la
// pantalla y los botones para seguir el flujo del mapa de navegación.
// CUANDO SE CONSTRUYA: productos por categoría con opciones para marcar
// "Agotado", editar y eliminar (borrado lógico: se desactiva, no se
// borra).
// =====================================================================
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
