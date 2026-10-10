// =====================================================================
// PANTALLA · Agenda (pestaña del cliente)
// Ruta: /agenda   ·   Historia: HU-12, HU-13
// Quién la ve: visitantes y clientes (no necesita sesión)
// Se llega desde: pestaña "Agenda" del menú inferior
// Lleva a: /comprar-entradas/[id] (pide sesión)
//
// ESTADO: plantilla temporal. <PantallaPendiente> muestra qué hará la
// pantalla y los botones para seguir el flujo del mapa de navegación.
// CUANDO SE CONSTRUYA: pedirá la agenda a la API (GET /api/agenda): una
// sola lista con actividades y eventos. Cada tarjeta muestra nombre,
// descripción y "Entrada gratuita" o "Cover: ₡…". Las que tienen cover
// traen en la misma tarjeta el botón "Comprar entradas" (no hay una
// pantalla de detalle aparte).
// =====================================================================
import PantallaPendiente from '../../components/PantallaPendiente';
import Boton from '../../components/Boton';

export default function Agenda() {
  return (
    <PantallaPendiente
      hu="HU-12"
      titulo="Agenda"
      descripcion="Actividades y eventos en una sola lista, con nombre y descripción (día, fecha y hora escritos). Cada uno indica “Entrada gratuita” o “Cover: ₡…”; los que tienen cover traen el botón “Comprar entradas”. Se ve sin iniciar sesión."
    >
      {/* requiereSesion: si es un visitante sin sesión, el botón lo lleva a Iniciar sesión */}
      <Boton texto="Comprar entradas (evento con cover, ejemplo)" href="/comprar-entradas/7" requiereSesion />
    </PantallaPendiente>
  );
}
