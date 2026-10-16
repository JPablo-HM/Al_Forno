// =====================================================================
// PANTALLA · Reservas (pestaña del cliente) = "Mis reservas"
// Ruta: /reservas   ·   Historia: HU-10, HU-11
// Quién la ve: todos; el contenido depende de la sesión
// Se llega desde: pestaña "Reservas" del menú inferior; Perfil → "Mis reservas"
// Lleva a: /nueva-reserva
//
//   · Visitante: invita a iniciar sesión (HU-10 y HU-11 piden sesión).
//   · Cliente: sus reservas de hoy en adelante (GET /api/reservas) con día,
//     hora, personas y estado. Las "Confirmada" tienen el botón
//     "Cancelar", que pide confirmación (HU-11). Se recarga cada vez que
//     la pestaña aparece (useFocusEffect).
// =====================================================================
import { useCallback, useState } from 'react';
import { ScrollView, View, Text, Pressable, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Boton from '../../components/Boton';
import { useSesion } from '../../context/SesionContext';
import { listarMisReservas, cancelarReserva } from '../../services/reservas';
import { COLORES } from '../../config/config';

export default function Reservas() {
  const { usuario, token } = useSesion();
  const [reservas, setReservas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargar = useCallback(() => {
    if (!token) return;
    setError(null);
    listarMisReservas(token)
      .then(setReservas)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, [token]);

  // Cada vez que se abre la pestaña (por ejemplo, al volver de Nueva reserva).
  useFocusEffect(cargar);

  // HU-11 · Pide confirmación y cancela. Alert.alert muestra el aviso del
  // teléfono con dos botones; solo "Sí, cancelar" ejecuta la cancelación.
  function confirmarCancelacion(reserva) {
    Alert.alert(
      'Cancelar reserva',
      `¿Seguro que querés cancelar la reserva del ${reserva.fechaTexto} a las ${reserva.horaTexto}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: () =>
            cancelarReserva(token, reserva.id)
              .then(cargar)
              .catch((e) => Alert.alert('No se pudo cancelar', e.message)),
        },
      ]
    );
  }

  // Visitante sin sesión
  if (!usuario) {
    return (
      <ScrollView style={estilos.fondo} contentContainerStyle={estilos.contenedor}>
        <View style={estilos.centro}>
          <Ionicons name="calendar-outline" size={64} color={COLORES.terracota} />
          <Text style={estilos.titulo}>Reservá tu mesa</Text>
          <Text style={estilos.suave}>Iniciá sesión para reservar y ver tus reservas.</Text>
        </View>
        <Boton texto="Iniciar sesión" href="/login" />
      </ScrollView>
    );
  }

  let contenido;
  if (cargando) {
    contenido = <ActivityIndicator color={COLORES.terracota} style={{ marginTop: 24 }} />;
  } else if (error) {
    contenido = <Text style={estilos.error}>No se pudieron cargar tus reservas. {error}</Text>;
  } else if (reservas.length === 0) {
    contenido = (
      <View style={estilos.centro}>
        <Ionicons name="calendar-clear-outline" size={48} color={COLORES.textoSuave} />
        <Text style={estilos.vacio}>No tenés reservas próximas</Text>
      </View>
    );
  } else {
    contenido = reservas.map((r) => {
      const cancelada = r.estado === 'Cancelada';
      return (
        <View key={r.id} style={[estilos.tarjeta, cancelada && { opacity: 0.6 }]}>
          <View style={estilos.fila}>
            <Text style={estilos.fecha}>{r.fechaTexto}</Text>
            <Text style={[estilos.estado, cancelada ? estilos.estadoCancelada : estilos.estadoConfirmada]}>{r.estado}</Text>
          </View>
          <Text style={estilos.detalle}>
            {r.horaTexto} · {r.personas} {r.personas === 1 ? 'persona' : 'personas'}
          </Text>
          {!cancelada ? (
            <Pressable onPress={() => confirmarCancelacion(r)} style={estilos.cancelar}>
              <Text style={estilos.cancelarTexto}>Cancelar reserva</Text>
            </Pressable>
          ) : null}
        </View>
      );
    });
  }

  return (
    <ScrollView style={estilos.fondo} contentContainerStyle={estilos.contenedor}>
      <Boton texto="Nueva reserva" href="/nueva-reserva" />
      <Text style={estilos.seccion}>MIS RESERVAS</Text>
      {contenido}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  fondo: { backgroundColor: COLORES.crema },
  contenedor: { padding: 16, paddingBottom: 32 },
  centro: { alignItems: 'center', paddingVertical: 24 },
  titulo: { fontSize: 24, fontWeight: 'bold', color: COLORES.texto, marginTop: 8 },
  suave: { color: COLORES.textoSuave, marginTop: 6 },
  seccion: { color: COLORES.terracota, fontWeight: 'bold', letterSpacing: 2, marginTop: 24, marginBottom: 10 },
  tarjeta: { backgroundColor: COLORES.cremaClara, borderRadius: 8, padding: 16, marginBottom: 12 },
  fila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fecha: { fontSize: 17, fontWeight: 'bold', color: COLORES.texto, flexShrink: 1 },
  detalle: { color: COLORES.texto, marginTop: 6 },
  estado: { fontSize: 12, fontWeight: 'bold', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, overflow: 'hidden' },
  estadoConfirmada: { backgroundColor: COLORES.terracota, color: '#FFFFFF' },
  estadoCancelada: { backgroundColor: '#EADFD3', color: COLORES.texto },
  cancelar: { marginTop: 12, alignSelf: 'flex-start' },
  cancelarTexto: { color: COLORES.terracotaOscuro, fontWeight: 'bold', textDecorationLine: 'underline' },
  vacio: { fontSize: 17, fontWeight: 'bold', color: COLORES.texto, marginTop: 10 },
  error: { color: COLORES.terracotaOscuro, marginTop: 12 },
});
