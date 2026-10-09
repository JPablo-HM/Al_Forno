// =====================================================================
// PANTALLA · Carrito
// Ruta: /carrito   ·   Historia: HU-07
// Quién la ve: solo clientes con sesión iniciada
// Se llega desde: Menú → "Ver carrito"
// Lleva a: /resumen-pedido
//
// ESTADO: plantilla temporal. <PantallaPendiente> muestra qué hará la
// pantalla y los botones para seguir el flujo del mapa de navegación.
// CUANDO SE CONSTRUYA: mostrará los productos agregados con cantidades de
// 1 a 10, subtotales, total y una nota de hasta 200 caracteres. El carrito
// se guardará en un contexto (como la sesión) para que no se pierda al
// cambiar de pantalla.
// =====================================================================
import PantallaPendiente from '../components/PantallaPendiente';
import Boton from '../components/Boton';

export default function Carrito() {
  return (
    <PantallaPendiente
      hu="HU-07"
      titulo="Carrito"
      descripcion="Productos agregados, cantidades de 1 a 10, subtotal por producto, total y nota de hasta 200 caracteres. Se conserva si el cliente sale de la pantalla."
    >
      <Boton texto="Continuar" href="/resumen-pedido" />
    </PantallaPendiente>
  );
}
