// =====================================================================
// COMPONENTE · Tarjeta de un producto del menú (HU-03, HU-07)
// Muestra nombre, descripción y precio en colones, y el botón "+" para
// agregarlo al carrito.
// Props: producto = { id, nombre, descripcion, precio }
//
// Botón "+":
//   · Visitante sin sesión → lo lleva a Iniciar sesión (HU-07 pide sesión).
//   · Cliente con sesión   → agrega el producto al carrito; si ya estaba,
//                            le suma 1 (máximo 10).
// =====================================================================
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSesion } from '../context/SesionContext';
import { useCarrito } from '../context/CarritoContext';
import { formatearColones } from '../utils/formato';
import { COLORES } from '../config/config';

export default function TarjetaProducto({ producto }) {
  const router = useRouter();
  const { usuario } = useSesion();
  const { agregar } = useCarrito();

  function alTocarMas() {
    if (!usuario) return router.push('/login');
    agregar(producto);
  }

  return (
    <View style={estilos.tarjeta}>
      {/* Izquierda: los datos del producto (flex: 1 ocupa el espacio libre) */}
      <View style={estilos.datos}>
        <Text style={estilos.nombre}>{producto.nombre}</Text>
        <Text style={estilos.descripcion}>{producto.descripcion}</Text>
        <Text style={estilos.precio}>{formatearColones(producto.precio)}</Text>
      </View>

      {/* Derecha: botón "+" */}
      <Pressable onPress={alTocarMas} style={({ pressed }) => [estilos.botonMas, pressed && { opacity: 0.7 }]}>
        <Ionicons name="add" size={24} color={COLORES.crema} />
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: COLORES.cremaClara, borderRadius: 8, padding: 16, marginBottom: 12 },
  datos: { flex: 1, marginRight: 12 },
  nombre: { fontSize: 18, fontWeight: 'bold', color: COLORES.texto },
  descripcion: { color: COLORES.textoSuave, marginTop: 4, lineHeight: 20 },
  precio: { fontSize: 16, fontWeight: 'bold', color: COLORES.terracota, marginTop: 8 },
  botonMas: { backgroundColor: COLORES.negro, borderRadius: 8, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
});
