// HU-02 · Perfil
// Sin sesión: botones para iniciar sesión o crear cuenta.
// Con sesión de cliente: Mi perfil, Mis pedidos, Mis reservas, Mis tickets y Cerrar sesión.
import { useRouter } from 'expo-router';
import { Text, StyleSheet } from 'react-native';
import PantallaPendiente from '../../components/PantallaPendiente';
import Boton from '../../components/Boton';
import { useSesion } from '../../context/SesionContext';
import { COLORES } from '../../config/config';

export default function Perfil() {
  const router = useRouter();
  const { usuario, cerrarSesion } = useSesion();

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
    <PantallaPendiente hu="HU-02" titulo="Mi perfil" descripcion="Nombre, cédula, teléfono y correo del cliente.">
      <Text style={estilos.nombre}>{usuario.nombre_completo}</Text>
      <Boton texto="Mis pedidos" href="/mis-pedidos" />
      <Boton texto="Mis reservas" href="/mis-reservas" />
      <Boton texto="Mis tickets" href="/mis-tickets" />
      <Boton
        texto="Cerrar sesión"
        variante="secundario"
        onPress={() => {
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
