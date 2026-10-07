// HU-08 · Comprobante
// Pantalla temporal: se reemplaza al construir la pantalla real.
import { useLocalSearchParams } from 'expo-router';
import PantallaPendiente from '../../components/PantallaPendiente';
import Boton from '../../components/Boton';

export default function Comprobante() {
  const { id } = useLocalSearchParams();
  return (
    <PantallaPendiente
      hu="HU-08"
      titulo={`Comprobante · ${id}`}
      descripcion="Número de pedido, fecha y hora, productos, total y últimos 4 dígitos de la tarjeta. No es factura electrónica."
    >
      <Boton texto="Ver estado del pedido" href={`/mis-pedidos/${id}`} />
      <Boton texto="Volver al inicio" href="/" variante="secundario" />
    </PantallaPendiente>
  );
}
