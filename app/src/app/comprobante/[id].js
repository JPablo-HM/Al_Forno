// =====================================================================
// PANTALLA · Comprobante del pedido
// Ruta: /comprobante/[id]   ·   Historia: HU-08
// Quién la ve: solo clientes con sesión iniciada
// Se llega desde: Pago aprobado (no tiene flecha "atrás" para no volver a pagar)
// Lleva a: /mis-pedidos/[id] y / (Inicio)
//
// ESTADO: plantilla temporal. <PantallaPendiente> muestra qué hará la
// pantalla y los botones para seguir el flujo del mapa de navegación.
// CUANDO SE CONSTRUYA: pedirá el pedido a la API y mostrará número, fecha
// y hora, productos, total y los últimos 4 dígitos de la tarjeta.
// =====================================================================
import { useLocalSearchParams } from 'expo-router';
import PantallaPendiente from '../../components/PantallaPendiente';
import Boton from '../../components/Boton';

export default function Comprobante() {
  // Lee la parte variable de la ruta ([id] en el nombre del archivo).
  // Ej.: en /comprobante/15, id vale "15" (siempre llega como texto).
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
