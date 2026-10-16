// =====================================================================
// PANTALLA · Mis pedidos
// Ruta: /mis-pedidos   ·   Historia: HU-09
// Quién la ve: solo clientes con sesión iniciada
// Se llega desde: Perfil → "Mis pedidos"
// Lleva a: /mis-pedidos/[id]
//
// Lista los pedidos del cliente (GET /api/pedidos, con el token), del más
// reciente al más antiguo, con número, fecha, total y estado. Se vuelve a
// cargar cada vez que la pantalla aparece (useFocusEffect), así un pedido
// que ya pasó a "Listo para recoger" se ve actualizado al regresar.
// =====================================================================
import { useCallback, useState } from 'react';
import { ScrollView, View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSesion } from '../../context/SesionContext';
import { listarMisPedidos } from '../../services/pedidos';
import EtiquetaEstado from '../../components/EtiquetaEstado';
import Boton from '../../components/Boton';
import { formatearColones, formatearFecha } from '../../utils/formato';
import { COLORES } from '../../config/config';

export default function MisPedidos() {
  const router = useRouter();
  const { token } = useSesion();
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // useFocusEffect: como useEffect, pero se ejecuta CADA VEZ que la pantalla
  // vuelve a verse (no solo la primera). useCallback evita repetirlo sin razón.
  useFocusEffect(
    useCallback(() => {
      setError(null);
      listarMisPedidos(token)
        .then(setPedidos)
        .catch((e) => setError(e.message))
        .finally(() => setCargando(false));
    }, [token])
  );

  if (cargando) {
    return (
      <View style={estilos.centro}>
        <ActivityIndicator color={COLORES.terracota} />
      </View>
    );
  }
  if (error) {
    return (
      <View style={estilos.centro}>
        <Text style={estilos.error}>No se pudieron cargar tus pedidos. {error}</Text>
      </View>
    );
  }
  // Estado vacío
  if (pedidos.length === 0) {
    return (
      <View style={estilos.centro}>
        <Ionicons name="receipt-outline" size={48} color={COLORES.textoSuave} />
        <Text style={estilos.vacioTitulo}>Aún no tenés pedidos</Text>
        <Boton texto="Ver menú" href="/menu" variante="secundario" />
      </View>
    );
  }

  return (
    <ScrollView style={estilos.fondo} contentContainerStyle={estilos.contenedor}>
      {pedidos.map((p) => (
        <Pressable
          key={p.id}
          onPress={() => router.push(`/mis-pedidos/${p.id}`)}
          style={({ pressed }) => [estilos.tarjeta, pressed && { opacity: 0.8 }]}
        >
          <View style={estilos.fila}>
            <Text style={estilos.numero}>Pedido #{p.id}</Text>
            <Text style={estilos.total}>{formatearColones(p.total)}</Text>
          </View>
          <Text style={estilos.fecha}>{formatearFecha(p.fecha)}</Text>
          <View style={[estilos.fila, { marginTop: 10 }]}>
            <EtiquetaEstado estado={p.estado} />
            <Ionicons name="chevron-forward" size={20} color={COLORES.textoSuave} />
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  fondo: { backgroundColor: COLORES.crema },
  contenedor: { padding: 16, paddingBottom: 32 },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: COLORES.crema },
  tarjeta: { backgroundColor: COLORES.cremaClara, borderRadius: 8, padding: 16, marginBottom: 12 },
  fila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  numero: { fontSize: 18, fontWeight: 'bold', color: COLORES.texto },
  total: { fontSize: 16, fontWeight: 'bold', color: COLORES.texto },
  fecha: { color: COLORES.textoSuave, marginTop: 4 },
  vacioTitulo: { fontSize: 18, fontWeight: 'bold', color: COLORES.texto, marginTop: 12 },
  error: { color: COLORES.terracotaOscuro, textAlign: 'center' },
});
