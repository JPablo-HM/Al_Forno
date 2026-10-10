// =====================================================================
// PANTALLA · Resumen del pedido
// Ruta: /resumen-pedido   ·   Historia: HU-07
// Quién la ve: solo clientes con sesión iniciada
// Se llega desde: Carrito → "Continuar"
// Lleva a: /pago ("Confirmar y pagar"; la pantalla Pago es plantilla en
//          esta entrega)
//
// Muestra el pedido completo antes de pagar: que es para llevar, los
// productos con cantidad y subtotal, el total y el nombre del cliente.
// Solo lee datos (carrito y sesión); no cambia nada.
// =====================================================================
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCarrito } from '../context/CarritoContext';
import { useSesion } from '../context/SesionContext';
import { formatearColones } from '../utils/formato';
import Boton from '../components/Boton';
import { COLORES } from '../config/config';

export default function ResumenPedido() {
  const { productos, total } = useCarrito();
  const { usuario } = useSesion();

  return (
    <ScrollView style={estilos.fondo} contentContainerStyle={estilos.contenedor}>
      {/* Todos los pedidos son para llevar (HU-07) */}
      <View style={estilos.tarjeta}>
        <Text style={estilos.etiqueta}>PARA LLEVAR</Text>
        <View style={estilos.filaIcono}>
          <Ionicons name="location-outline" size={18} color={COLORES.terracota} />
          <Text style={estilos.texto}>Recoger en AL FORNO</Text>
        </View>
      </View>

      {/* Productos: "2 × Aperol Spritz ..... ₡9.600" */}
      <View style={estilos.tarjeta}>
        {productos.map((p) => (
          <View key={p.id} style={estilos.linea}>
            <Text style={estilos.texto}>{p.cantidad} × {p.nombre}</Text>
            <Text style={estilos.texto}>{formatearColones(p.precio * p.cantidad)}</Text>
          </View>
        ))}
        <View style={[estilos.linea, estilos.lineaTotal]}>
          <Text style={estilos.totalTexto}>Total</Text>
          <Text style={estilos.totalMonto}>{formatearColones(total)}</Text>
        </View>
      </View>

      <View style={estilos.tarjeta}>
        <Text style={estilos.etiquetaSuave}>Cliente</Text>
        <Text style={estilos.texto}>{usuario?.nombre_completo}</Text>
      </View>

      <Boton texto="Confirmar y pagar" href="/pago" />
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  fondo: { backgroundColor: COLORES.crema },
  contenedor: { padding: 16, paddingBottom: 32 },
  tarjeta: { backgroundColor: COLORES.cremaClara, borderRadius: 8, padding: 16, marginBottom: 12 },
  etiqueta: { color: COLORES.terracota, fontWeight: 'bold', letterSpacing: 2, marginBottom: 8 },
  etiquetaSuave: { color: COLORES.textoSuave, marginBottom: 4 },
  filaIcono: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  texto: { color: COLORES.texto, fontSize: 15 },
  linea: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  lineaTotal: { borderTopWidth: 1, borderTopColor: COLORES.crema, marginTop: 8, paddingTop: 12 },
  totalTexto: { fontSize: 18, fontWeight: 'bold', color: COLORES.texto },
  totalMonto: { fontSize: 20, fontWeight: 'bold', color: COLORES.terracota },
});
