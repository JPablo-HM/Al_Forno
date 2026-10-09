// =====================================================================
// PANTALLA · Resumen del pedido
// Ruta: /resumen-pedido   ·   Historia: HU-07
// Quién la ve: solo clientes con sesión iniciada
// Se llega desde: Carrito → "Continuar"
// Lleva a: /pago
//
// ESTADO: plantilla temporal. <PantallaPendiente> muestra qué hará la
// pantalla y los botones para seguir el flujo del mapa de navegación.
// CUANDO SE CONSTRUYA: mostrará el pedido completo antes de pagar. La API
// validará que se pida dentro del horario y hasta 30 minutos antes del
// cierre.
// =====================================================================
import PantallaPendiente from '../components/PantallaPendiente';
import Boton from '../components/Boton';

export default function ResumenPedido() {
  return (
    <PantallaPendiente
      hu="HU-07"
      titulo="Resumen del pedido"
      descripcion="Productos, cantidades, nota y total antes de pagar. Solo permite confirmar dentro del horario y hasta 30 minutos antes del cierre."
    >
      <Boton texto="Ir a pagar" href="/pago" />
    </PantallaPendiente>
  );
}
