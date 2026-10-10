// =====================================================================
// PANTALLA · Pago con tarjeta (simulado)
// Ruta: /pago   ·   Historia: HU-08
// Quién la ve: solo clientes con sesión iniciada
// Se llega desde: Resumen del pedido → "Ir a pagar"
// Lleva a: /mis-pedidos/[id] (detalle y comprobante del pedido nuevo)
//
// ESTADO: plantilla temporal. <PantallaPendiente> muestra qué hará la
// pantalla y los botones para seguir el flujo del mapa de navegación.
// CUANDO SE CONSTRUYA: formulario de tarjeta (16 dígitos, titular,
// vencimiento, CVV). Enviará carrito + tarjeta a POST /api/pedidos; el
// simulador de pagos aprueba o rechaza. Si se rechaza, se muestra el
// motivo y el carrito se conserva. La tarjeta nunca se guarda. Al aprobarse,
// usará router.replace (no push) para que la flecha "atrás" no vuelva al pago.
// =====================================================================
import PantallaPendiente from '../components/PantallaPendiente';
import Boton from '../components/Boton';

export default function Pago() {
  return (
    <PantallaPendiente
      hu="HU-08"
      titulo="Pago con tarjeta"
      descripcion="Número de tarjeta (16 dígitos), titular, vencimiento y CVV. El pago es simulado: si se rechaza, se informa y el carrito se conserva."
    >
      <Boton texto="Pagar (simulado)" href="/mis-pedidos/1" />
    </PantallaPendiente>
  );
}
