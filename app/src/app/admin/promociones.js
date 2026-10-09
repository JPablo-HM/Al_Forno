// =====================================================================
// PANTALLA · Promociones (admin)
// Ruta: /admin/promociones   ·   Historia: HU-17
// Quién la ve: solo el administrador
// Se llega desde: Más → "Promociones"
// Lleva a: /admin/promocion/[id]
//
// ESTADO: plantilla temporal. <PantallaPendiente> muestra qué hará la
// pantalla y los botones para seguir el flujo del mapa de navegación.
// CUANDO SE CONSTRUYA: todas las promociones con su vigencia y si están
// activas.
// =====================================================================
import PantallaPendiente from '../../components/PantallaPendiente';
import Boton from '../../components/Boton';

export default function ListaPromociones() {
  return (
    <PantallaPendiente
      hu="HU-17"
      titulo="Promociones"
      descripcion="Todas las promociones, con su vigencia y si están activas."
    >
      <Boton texto="Nueva promoción" href="/admin/promocion/nuevo" />
    </PantallaPendiente>
  );
}
