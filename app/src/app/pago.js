// HU-08 · Pago con tarjeta
// Pantalla temporal: se reemplaza al construir la pantalla real.
import PantallaPendiente from '../components/PantallaPendiente';
import Boton from '../components/Boton';

export default function Pago() {
  return (
    <PantallaPendiente
      hu="HU-08"
      titulo="Pago con tarjeta"
      descripcion="Número de tarjeta (16 dígitos), titular, vencimiento y CVV. El pago es simulado: si se rechaza, se informa y el carrito se conserva."
    >
      <Boton texto="Pagar (simulado)" href="/comprobante/1" />
    </PantallaPendiente>
  );
}
