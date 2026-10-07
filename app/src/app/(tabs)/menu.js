// HU-03 · Menú
// Pantalla temporal: se reemplaza al construir la pantalla real.
import PantallaPendiente from '../../components/PantallaPendiente';
import Boton from '../../components/Boton';

export default function Menu() {
  return (
    <PantallaPendiente
      hu="HU-03"
      titulo="Menú"
      descripcion="Productos por categoría (Pizzas, Cucina italiana, Coctelería, Cervezas) con nombre, descripción y precio en colones. Los agotados se muestran con su etiqueta y no se pueden agregar. Se ve sin iniciar sesión."
    >
      <Boton texto="Ver carrito" href="/carrito" requiereSesion />
    </PantallaPendiente>
  );
}
