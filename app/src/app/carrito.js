// =====================================================================
// PANTALLA · Carrito
// Ruta: /carrito   ·   Historia: HU-07
// Quién la ve: solo clientes con sesión iniciada
// Se llega desde: Menú → ícono 🛒 de la barra superior
// Lleva a: /resumen-pedido ("Continuar") o /menu (si está vacío)
//
// Muestra los productos del carrito (CarritoContext) con su subtotal
// (precio × cantidad), botones − y + para cambiar la cantidad (1 a 10),
// botón 🗑 para quitarlo, y el total. Todo se actualiza solo porque lee
// el carrito del contexto.
// =====================================================================
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCarrito } from '../context/CarritoContext';
import { CANTIDAD_MINIMA, CANTIDAD_MAXIMA } from '../utils/carrito';
import { formatearColones } from '../utils/formato';
import Boton from '../components/Boton';
import { COLORES } from '../config/config';

export default function Carrito() {
  const { productos, total, cambiarCantidad, quitar } = useCarrito();

  // Carrito vacío: mensaje y botón para volver al menú
  if (productos.length === 0) {
    return (
      <View style={estilos.vacio}>
        <Ionicons name="cart-outline" size={48} color={COLORES.textoSuave} />
        <Text style={estilos.vacioTexto}>Tu carrito está vacío</Text>
        <Boton texto="Ver menú" href="/menu" variante="secundario" />
      </View>
    );
  }

  return (
    <ScrollView style={estilos.fondo} contentContainerStyle={estilos.contenedor}>
      {/* Un recuadro por producto */}
      {productos.map((p) => (
        <View key={p.id} style={estilos.fila}>
          <View style={estilos.encabezado}>
            <Text style={estilos.nombre}>{p.nombre}</Text>
            {/* Subtotal = precio × cantidad */}
            <Text style={estilos.subtotal}>{formatearColones(p.precio * p.cantidad)}</Text>
          </View>

          <View style={estilos.controles}>
            {/* − y + : el botón se deshabilita (disabled) en 1 y en 10 */}
            <View style={estilos.cantidad}>
              <BotonIcono
                icono="remove"
                deshabilitado={p.cantidad <= CANTIDAD_MINIMA}
                onPress={() => cambiarCantidad(p.id, p.cantidad - 1)}
              />
              <Text style={estilos.numero}>{p.cantidad}</Text>
              <BotonIcono
                icono="add"
                deshabilitado={p.cantidad >= CANTIDAD_MAXIMA}
                onPress={() => cambiarCantidad(p.id, p.cantidad + 1)}
              />
            </View>
            <BotonIcono icono="trash-outline" onPress={() => quitar(p.id)} />
          </View>
        </View>
      ))}

      <View style={estilos.totalFila}>
        <Text style={estilos.totalTexto}>Total</Text>
        <Text style={estilos.totalMonto}>{formatearColones(total)}</Text>
      </View>

      <Boton texto="Continuar" href="/resumen-pedido" />
    </ScrollView>
  );
}

// Botón cuadrado con un ícono (−, +, 🗑). Se usa solo en esta pantalla.
function BotonIcono({ icono, onPress, deshabilitado = false }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={deshabilitado}
      style={({ pressed }) => [estilos.botonIcono, deshabilitado && { opacity: 0.3 }, pressed && { opacity: 0.6 }]}
    >
      <Ionicons name={icono} size={20} color={COLORES.texto} />
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  fondo: { backgroundColor: COLORES.crema },
  contenedor: { padding: 16, paddingBottom: 32 },
  vacio: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: COLORES.crema },
  vacioTexto: { fontSize: 18, fontWeight: 'bold', color: COLORES.texto, marginTop: 12 },
  fila: { backgroundColor: COLORES.cremaClara, borderRadius: 8, padding: 16, marginBottom: 12 },
  encabezado: { flexDirection: 'row', justifyContent: 'space-between' },
  nombre: { flex: 1, fontSize: 18, fontWeight: 'bold', color: COLORES.texto, marginRight: 8 },
  subtotal: { fontSize: 16, fontWeight: 'bold', color: COLORES.texto },
  controles: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  cantidad: { flexDirection: 'row', alignItems: 'center' },
  numero: { fontSize: 16, fontWeight: 'bold', color: COLORES.texto, minWidth: 32, textAlign: 'center' },
  botonIcono: { borderWidth: 1, borderColor: COLORES.textoSuave, borderRadius: 6, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  totalFila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 4 },
  totalTexto: { fontSize: 20, fontWeight: 'bold', color: COLORES.texto },
  totalMonto: { fontSize: 22, fontWeight: 'bold', color: COLORES.terracota },
});
