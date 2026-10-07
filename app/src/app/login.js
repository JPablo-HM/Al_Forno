// HU-02 · HU-14 · Iniciar sesión
// Un mismo login para clientes y administradores: la API responde con el rol.
// Al iniciar sesión, la navegación lleva al cliente a Inicio y al
// administrador directo a su panel (ver src/app/_layout.js).
//
// ⚠ TEMPORAL: mientras no exista POST /api/auth/login, los dos botones de
// prueba simulan una sesión para poder recorrer la navegación. Se eliminan
// al conectar el login real.
import { Text, StyleSheet } from 'react-native';
import PantallaPendiente from '../components/PantallaPendiente';
import Boton from '../components/Boton';
import { useSesion } from '../context/SesionContext';
import { COLORES } from '../config/config';

export default function Login() {
  const { iniciarSesion } = useSesion();

  return (
    <PantallaPendiente
      hu="HU-02 · HU-14"
      titulo="Iniciar sesión"
      descripcion="Correo y contraseña. Si los datos son incorrectos: “Correo o contraseña incorrectos”. No hay recuperación de contraseña."
    >
      <Text style={estilos.prueba}>Solo para probar la navegación:</Text>
      <Boton
        texto="Entrar como cliente (prueba)"
        onPress={() => iniciarSesion({ id: 2, nombre_completo: 'Cliente de prueba', rol: 'CLIENTE' })}
      />
      <Boton
        texto="Entrar como administrador (prueba)"
        onPress={() => iniciarSesion({ id: 1, nombre_completo: 'Administrador AL FORNO', rol: 'ADMIN' })}
      />
      <Boton texto="¿No tienes cuenta? Crear cuenta" href="/registro" variante="secundario" />
    </PantallaPendiente>
  );
}

const estilos = StyleSheet.create({
  prueba: { color: COLORES.textoSuave, fontStyle: 'italic' },
});
