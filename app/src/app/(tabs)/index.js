// HU-04 · HU-05 · HU-06 · Inicio
// Pantalla temporal: se reemplaza al construir la pantalla real.
import PantallaPendiente from '../../components/PantallaPendiente';

export default function Inicio() {
  return (
    <PantallaPendiente
      hu="HU-04 · HU-05 · HU-06"
      titulo="Inicio"
      descripcion="Horario de la semana con el indicador “Abierto ahora” o “Cerrado” (hora de Costa Rica), dirección con señas, teléfono/WhatsApp y promociones vigentes. Se ve sin iniciar sesión."
    />
  );
}
