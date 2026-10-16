// =====================================================================
// PANTALLA · Pedido: estado y comprobante
// Ruta: /mis-pedidos/[id]   ·   Historia: HU-08, HU-09
// Quién la ve: solo clientes con sesión iniciada
// Se llega desde: Mis pedidos, o desde Pago al aprobarse el pago
//
// Pide el pedido a la API (GET /api/pedidos/:id, con el token) y muestra:
//   · El estado: "Recibido" y, 10 segundos después de pagar, "Listo para
//     recoger". La API manda segundosParaListo y la pantalla se vuelve a
//     cargar sola justo en ese momento (setTimeout).
//   · El comprobante (HU-08): número, fecha y hora, productos, total y
//     últimos 4 dígitos de la tarjeta. No es factura electrónica.
// =====================================================================
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSesion } from '../../context/SesionContext';
import { obtenerPedido } from '../../services/pedidos';
import EtiquetaEstado from '../../components/EtiquetaEstado';
import { formatearColones, formatearFecha } from '../../utils/formato';
import { COLORES } from '../../config/config';

export default function DetallePedido() {
  // En /mis-pedidos/15, id vale "15".
  const { id } = useLocalSearchParams();
  const { token } = useSesion();
  const [pedido, setPedido] = useState(null);
  const [error, setError] = useState(null);

  const cargar = useCallback(() => {
    obtenerPedido(token, id)
      .then(setPedido)
      .catch((e) => setError(e.message));
  }, [token, id]);

  // Primera carga.
  useEffect(() => {
    cargar();
  }, [cargar]);

  // Si todavía está "Recibido", programa otra carga para cuando pase a
  // "Listo". return () => clearTimeout(...) cancela el temporizador si el
  // cliente sale de la pantalla antes.
  useEffect(() => {
    if (!pedido || pedido.segundosParaListo <= 0) return;
    const temporizador = setTimeout(cargar, pedido.segundosParaListo * 1000 + 500);
    return () => clearTimeout(temporizador);
  }, [pedido, cargar]);

  if (error) {
    return (
      <View style={estilos.centro}>
        <Text style={estilos.error}>{error}</Text>
      </View>
    );
  }
  if (!pedido) {
    return (
      <View style={estilos.centro}>
        <ActivityIndicator color={COLORES.terracota} />
      </View>
    );
  }

  const listo = pedido.estado === 'Listo para recoger';

  return (
    <ScrollView style={estilos.fondo} contentContainerStyle={estilos.contenedor}>
      {/* Estado */}
      <View style={[estilos.estado, listo && estilos.estadoListo]}>
        <Ionicons name={listo ? 'checkmark-circle' : 'time-outline'} size={40} color={listo ? '#FFFFFF' : COLORES.terracota} />
        <Text style={[estilos.estadoTitulo, listo && estilos.textoClaro]}>
          {listo ? '¡Tu pedido está listo!' : 'Recibimos tu pedido'}
        </Text>
        <Text style={[estilos.estadoTexto, listo && estilos.textoClaro]}>
          {listo ? 'Ya podés pasar a recogerlo en AL FORNO.' : 'Lo estamos preparando. Esta pantalla se actualiza sola.'}
        </Text>
      </View>

      {/* Comprobante */}
      <View style={estilos.tarjeta}>
        <View style={estilos.fila}>
          <Text style={estilos.etiqueta}>COMPROBANTE</Text>
          <EtiquetaEstado estado={pedido.estado} />
        </View>
        <Text style={estilos.numero}>Pedido #{pedido.id}</Text>
        <Text style={estilos.suave}>{formatearFecha(pedido.fecha)}</Text>
        <Text style={estilos.suave}>Para llevar · Recoger en AL FORNO</Text>

        <View style={estilos.separador} />
        {pedido.productos.map((p) => (
          <View key={p.nombre} style={estilos.fila}>
            <Text style={estilos.texto}>{p.cantidad} × {p.nombre}</Text>
            <Text style={estilos.texto}>{formatearColones(p.subtotal)}</Text>
          </View>
        ))}
        <View style={estilos.separador} />

        <View style={estilos.fila}>
          <Text style={estilos.totalTexto}>Total pagado</Text>
          <Text style={estilos.totalTexto}>{formatearColones(pedido.total)}</Text>
        </View>
        <View style={[estilos.fila, { marginTop: 8 }]}>
          <Text style={estilos.suave}>Tarjeta</Text>
          <Text style={estilos.suave}>•••• {pedido.tarjeta_ultimos4}</Text>
        </View>
      </View>

      <Text style={estilos.nota}>Este comprobante no es una factura electrónica.</Text>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  fondo: { backgroundColor: COLORES.crema },
  contenedor: { padding: 16, paddingBottom: 32 },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: COLORES.crema },
  estado: { alignItems: 'center', backgroundColor: COLORES.cremaClara, borderRadius: 8, padding: 20, marginBottom: 16 },
  estadoListo: { backgroundColor: COLORES.terracota },
  estadoTitulo: { fontSize: 20, fontWeight: 'bold', color: COLORES.texto, marginTop: 8 },
  estadoTexto: { color: COLORES.textoSuave, marginTop: 4, textAlign: 'center' },
  textoClaro: { color: '#FFFFFF' },
  tarjeta: { backgroundColor: COLORES.cremaClara, borderRadius: 8, padding: 16 },
  fila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 3 },
  etiqueta: { color: COLORES.terracota, fontWeight: 'bold', letterSpacing: 2 },
  numero: { fontSize: 22, fontWeight: 'bold', color: COLORES.texto, marginTop: 8 },
  suave: { color: COLORES.textoSuave, marginTop: 2 },
  separador: { height: 1, backgroundColor: COLORES.crema, marginVertical: 12 },
  texto: { color: COLORES.texto, fontSize: 15, flexShrink: 1 },
  totalTexto: { fontSize: 17, fontWeight: 'bold', color: COLORES.texto },
  nota: { color: COLORES.textoSuave, fontSize: 12, textAlign: 'center', marginTop: 12 },
  error: { color: COLORES.terracotaOscuro, textAlign: 'center' },
});
