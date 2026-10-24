// =====================================================================
// PANTALLA · Perfil (pestaña del cliente)    Ruta: /perfil   ·   HU-01, HU-02
// Quién la ve: visitantes y clientes. Tiene DOS versiones según la sesión:
//   · Sin sesión: invita a iniciar sesión o crear cuenta.
//   · Con sesión: los datos del cliente (GET /api/perfil, con el token),
//     accesos a Mis pedidos y Mis reservas, y "Cerrar sesión".
// =====================================================================
import { useEffect, useState } from 'react';
import { ScrollView, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Boton from '../../components/Boton';
import { useSesion } from '../../context/SesionContext';
import { obtenerPerfil } from '../../services/perfil';
import { COLORES } from '../../config/config';

export default function Perfil() {
  const router = useRouter();
  // usuario es null si nadie ha iniciado sesión.
  const { usuario, token, cerrarSesion } = useSesion();

  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  // Cuando hay sesión, pide el perfil completo (con cédula y teléfono).
  // [token]: se vuelve a ejecutar si cambia la sesión.
  useEffect(() => {
    if (!token) {
      setPerfil(null);
      return;
    }
    setCargando(true);
    setError(null);
    obtenerPerfil(token)
      .then(setPerfil)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, [token]);

  // Versión 1: visitante sin sesión.
  if (!usuario) {
    return (
      <ScrollView style={estilos.fondo} contentContainerStyle={estilos.contenedor}>
        <View style={estilos.visitante}>
          <Ionicons name="person-circle-outline" size={72} color={COLORES.terracota} />
          <Text style={estilos.titulo}>Tu cuenta</Text>
          <Text style={estilos.texto}>Iniciá sesión para hacer pedidos y reservar.</Text>
        </View>
        <Boton texto="Iniciar sesión" href="/login" />
        <Boton texto="Crear cuenta" href="/registro" variante="secundario" />
      </ScrollView>
    );
  }

  // Versión 2: cliente con sesión iniciada.
  return (
    <ScrollView style={estilos.fondo} contentContainerStyle={estilos.contenedor}>
      <View style={estilos.tarjeta}>
        <Text style={estilos.etiquetaTarjeta}>MIS DATOS</Text>
        {cargando ? (
          <ActivityIndicator color={COLORES.terracota} />
        ) : error ? (
          <Text style={estilos.error}>No se pudieron cargar tus datos. {error}</Text>
        ) : perfil ? (
          <>
            <Text style={estilos.nombre}>{perfil.nombre_completo}</Text>
            <Dato icono="card-outline" etiqueta="Cédula" valor={perfil.cedula} />
            <Dato icono="call-outline" etiqueta="Teléfono" valor={perfil.telefono} />
            <Dato icono="mail-outline" etiqueta="Correo" valor={perfil.correo} />
          </>
        ) : null}
      </View>

      <Boton texto="Mis pedidos" href="/mis-pedidos" />
      <Boton texto="Mis reservas" href="/reservas" />
      <Boton
        texto="Cerrar sesión"
        variante="secundario"
        onPress={() => {
          // Borra la sesión (y el token): el usuario vuelve a ser visitante.
          cerrarSesion();
          router.replace('/'); // vuelve a Inicio
        }}
      />
    </ScrollView>
  );
}

// Una fila del perfil: ícono, etiqueta y valor. Solo se usa en esta pantalla.
function Dato({ icono, etiqueta, valor }) {
  return (
    <View style={estilos.dato}>
      <Ionicons name={icono} size={20} color={COLORES.terracota} />
      <View style={{ marginLeft: 12 }}>
        <Text style={estilos.datoEtiqueta}>{etiqueta}</Text>
        <Text style={estilos.datoValor}>{valor}</Text>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  fondo: { backgroundColor: COLORES.crema },
  contenedor: { padding: 16, paddingBottom: 32 },
  visitante: { alignItems: 'center', paddingVertical: 24 },
  titulo: { fontSize: 24, fontWeight: 'bold', color: COLORES.texto, marginTop: 8 },
  texto: { color: COLORES.textoSuave, marginTop: 6, textAlign: 'center' },
  tarjeta: { backgroundColor: COLORES.cremaClara, borderRadius: 8, padding: 16, marginBottom: 6 },
  etiquetaTarjeta: { color: COLORES.terracota, fontWeight: 'bold', letterSpacing: 2, marginBottom: 12 },
  nombre: { fontSize: 20, fontWeight: 'bold', color: COLORES.texto, marginBottom: 8 },
  dato: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: COLORES.crema },
  datoEtiqueta: { fontSize: 12, color: COLORES.textoSuave },
  datoValor: { fontSize: 16, color: COLORES.texto },
  error: { color: COLORES.terracotaOscuro },
});
