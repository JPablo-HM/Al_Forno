// =====================================================================
// PANTALLA · Crear cuenta
// Ruta: /registro   ·   Historia: HU-01
// Quién la ve: solo visitantes sin sesión
// Se llega desde: Perfil → "Crear cuenta" o el enlace "Registrate" del login
// Lleva a: Inicio (al crear la cuenta queda con sesión iniciada)
//
// ESTADO: plantilla temporal. <PantallaPendiente> muestra qué hará la
// pantalla y los botones para seguir el flujo del mapa de navegación.
// CUANDO SE CONSTRUYA: formulario con nombre, cédula (9 dígitos), teléfono
// (8), correo y contraseña escrita dos veces; enviará los datos a POST
// /api/auth/registro, que guarda la contraseña cifrada con bcrypt. El
// botón de prueba de abajo simula ese registro.
// =====================================================================
import PantallaPendiente from '../components/PantallaPendiente';
import Boton from '../components/Boton';
import { useSesion } from '../context/SesionContext';

export default function Registro() {
  // Mientras no exista la API, el botón de prueba inicia sesión como cliente.
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
