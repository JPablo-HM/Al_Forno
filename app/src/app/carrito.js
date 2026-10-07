// HU-07 · Carrito
// Pantalla temporal: se reemplaza al construir la pantalla real.
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
