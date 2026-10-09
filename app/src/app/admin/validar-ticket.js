// =====================================================================
// PANTALLA · Validar ticket (admin)
// Ruta: /admin/validar-ticket   ·   Historia: HU-19
// Quién la ve: solo el administrador
// Se llega desde: Más → "Validar ticket"
// Lleva a: — 
//
// ESTADO: plantilla temporal. <PantallaPendiente> muestra qué hará la
// pantalla y los botones para seguir el flujo del mapa de navegación.
// CUANDO SE CONSTRUYA: el administrador escribe el código del ticket en la
// entrada: si es válido queda "Usado"; si ya se usó o no existe, muestra
// el aviso.
// =====================================================================
import PantallaPendiente from '../../components/PantallaPendiente';

export default function ValidarTicket() {
  return (
    <PantallaPendiente
      hu="HU-19"
      titulo="Validar ticket"
      descripcion="El administrador escribe el código del ticket: si es válido queda “Usado”; si ya se usó o no existe, muestra un aviso."
    />
  );
}
