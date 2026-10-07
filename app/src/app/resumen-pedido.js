// HU-07 · Resumen del pedido
// Pantalla temporal: se reemplaza al construir la pantalla real.
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
