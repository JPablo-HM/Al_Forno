// =====================================================================
// PANTALLA · Perfil (pestaña del cliente)    Ruta: /perfil   ·   HU-01, HU-02
// Quién la ve: visitantes y clientes. Tiene DOS versiones según la sesión:
//   · Sin sesión: botones "Iniciar sesión" y "Crear cuenta".
//   · Con sesión de cliente: nombre, accesos a Mis pedidos / Mis reservas /
//     Mis tickets y "Cerrar sesión".
// CUANDO SE CONSTRUYA: mostrará cédula, teléfono y correo (GET /api/auth/perfil)
// como en el mockup HU-02.
// =====================================================================
import { useRouter } from 'expo-router';
import { Text, StyleSheet } from 'react-native';
import PantallaPendiente from '../../components/PantallaPendiente';
import Boton from '../../components/Boton';
import { useSesion } from '../../context/SesionContext';
import { COLORES } from '../../config/config';

export default function Perfil() {
  const router = useRouter();
  // usuario es null si nadie ha iniciado sesión.
  const { usuario, cerrarSesion } = useSesion();

  // Versión 1: visitante sin sesión.
  if (!usuario) {
    return (
      <PantallaPendiente
        hu="HU-01 · HU-02"
        titulo="Perfil"
        descripcion="Inicia sesión para hacer pedidos, reservar y comprar entradas."
      >
        <Boton texto="Iniciar sesión" href="/login" />
        <Boton texto="Crear cuenta" href="/registro" variante="secundario" />
      </PantallaPendiente>
    );
  }

  return (
    // Versión 2: cliente con sesión iniciada.
    <PantallaPendiente hu="HU-02" titulo="Mi perfil" descripcion="Nombre, cédula, teléfono y correo del cliente.">
      <Text style={estilos.nombre}>{usuario.nombre_completo}</Text>
      <Boton texto="Mis pedidos" href="/mis-pedidos" />
      <Boton texto="Mis reservas" href="/reservas" />
      <Boton texto="Mis tickets" href="/mis-tickets" />
      <Boton
        texto="Cerrar sesión"
        variante="secundario"
        onPress={() => {
          // Borra la sesión: el usuario vuelve a ser visitante.
          cerrarSesion();
          router.replace('/'); // vuelve a Inicio (mapa de navegación)
        }}
      />
    </PantallaPendiente>
  );
}

const estilos = StyleSheet.create({
  nombre: { fontSize: 18, fontWeight: 'bold', color: COLORES.texto, marginBottom: 6 },
});
