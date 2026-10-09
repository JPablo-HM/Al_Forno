// =====================================================================
// PANTALLA · Más opciones (admin)
// Ruta: /admin/mas   ·   Historia: HU-14, HU-17, HU-19
// Quién la ve: solo el administrador
// Se llega desde: pestaña "Más" del panel
// Lleva a: /admin/promociones, /admin/validar-ticket, /admin/historial-pedidos
//
// ESTADO: plantilla temporal. <PantallaPendiente> muestra qué hará la
// pantalla y los botones para seguir el flujo del mapa de navegación.
// CUANDO SE CONSTRUYA: se mantiene como menú de opciones. El botón "Cerrar
// sesión" ya funciona: borra la sesión y la navegación vuelve sola a la
// app de clientes.
// =====================================================================
import PantallaPendiente from '../../../components/PantallaPendiente';
import Boton from '../../../components/Boton';
import { useSesion } from '../../../context/SesionContext';

export default function MasAdmin() {
  const { usuario, cerrarSesion } = useSesion();

  return (
    <PantallaPendiente hu="HU-14" titulo="Más opciones" descripcion={`Sesión: ${usuario?.nombre_completo ?? ''}`}>
      <Boton texto="Promociones" href="/admin/promociones" />
      <Boton texto="Validar ticket" href="/admin/validar-ticket" />
      <Boton texto="Historial de pedidos" href="/admin/historial-pedidos" />
      {/* Al cerrar sesión, la navegación vuelve sola a la app de clientes (Inicio) */}
      <Boton texto="Cerrar sesión" variante="secundario" onPress={cerrarSesion} />
    </PantallaPendiente>
  );
}
