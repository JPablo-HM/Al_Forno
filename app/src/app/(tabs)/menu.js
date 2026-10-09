// =====================================================================
// PANTALLA · Menú (pestaña del cliente)
// Ruta: /menu   ·   Historia: HU-03
// Quién la ve: visitantes y clientes (no necesita sesión)
// Se llega desde: pestaña "Menú" del menú inferior
// Lleva a: /carrito (pide sesión)
//
// ESTADO: plantilla temporal. <PantallaPendiente> muestra qué hará la
// pantalla y los botones para seguir el flujo del mapa de navegación.
// CUANDO SE CONSTRUYA: pedirá los productos a la API (GET /api/menu) y los
// mostrará por categoría con su precio en colones. Los agotados se ven con
// etiqueta y no se pueden agregar. El carrito vivirá en la app (no en la
// base) hasta que se pague.
// =====================================================================
import PantallaPendiente from '../../components/PantallaPendiente';
import Boton from '../../components/Boton';

export default function Menu() {
  return (
    <PantallaPendiente
      hu="HU-03"
      titulo="Menú"
      descripcion="Productos por categoría (Pizzas, Cucina italiana, Coctelería, Cervezas) con nombre, descripción y precio en colones. Los agotados se muestran con su etiqueta y no se pueden agregar. Se ve sin iniciar sesión."
    >
      {/* requiereSesion: si es un visitante sin sesión, el botón lo lleva a Iniciar sesión */}
      <Boton texto="Ver carrito" href="/carrito" requiereSesion />
    </PantallaPendiente>
  );
}
