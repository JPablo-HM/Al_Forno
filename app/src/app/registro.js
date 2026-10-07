// HU-01 · Registro
// Al crear la cuenta, el cliente queda con la sesión iniciada y vuelve a Inicio.
//
// ⚠ TEMPORAL: el botón de prueba simula el registro hasta que exista
// POST /api/auth/registro.
import PantallaPendiente from '../components/PantallaPendiente';
import Boton from '../components/Boton';
import { useSesion } from '../context/SesionContext';

export default function Registro() {
  const { iniciarSesion } = useSesion();

  return (
    <PantallaPendiente
      hu="HU-01"
      titulo="Crear cuenta"
      descripcion="Nombre completo, cédula (9 dígitos), teléfono (8 dígitos), correo y contraseña (mínimo 8 caracteres, escrita dos veces)."
    >
      <Boton
        texto="Crear cuenta (prueba)"
        onPress={() => iniciarSesion({ id: 2, nombre_completo: 'Cliente de prueba', rol: 'CLIENTE' })}
      />
    </PantallaPendiente>
  );
}
