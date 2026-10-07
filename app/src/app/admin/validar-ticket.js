// HU-19 · Validar ticket
// Pantalla temporal: se reemplaza al construir la pantalla real.
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
