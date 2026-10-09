// =====================================================================
// PANTALLA · Historial de pedidos (admin)
// Ruta: /admin/historial-pedidos   ·   Historia: HU-16
// Quién la ve: solo el administrador
// Se llega desde: Pedidos entrantes o Más
// Lleva a: — 
//
// ESTADO: plantilla temporal. <PantallaPendiente> muestra qué hará la
// pantalla y los botones para seguir el flujo del mapa de navegación.
// CUANDO SE CONSTRUYA: pedidos entregados y anteriores con filtro por
// estado y fecha.
// =====================================================================
import PantallaPendiente from '../../components/PantallaPendiente';

export default function HistorialPedidos() {
  return (
    <PantallaPendiente
      hu="HU-16"
      titulo="Historial de pedidos"
      descripcion="Pedidos entregados y anteriores, con filtro por estado y fecha."
    />
  );
}
