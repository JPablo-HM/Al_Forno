// HU-17 · HU-19 · Más opciones del administrador
// Promociones, validar tickets en la entrada, historial y cerrar sesión.
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
