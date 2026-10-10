// =====================================================================
// COMPONENTE · Ícono del carrito en la barra superior del Menú
// Al tocarlo: si hay sesión de cliente va a /carrito; si es un visitante
// sin sesión va a Iniciar sesión (regla del mapa de navegación, HU-07).
//
// Encima del ícono muestra un círculo con la cantidad de unidades que hay
// en el carrito (ej. 2 Margheritas + 1 Negroni = 3). Así el cliente ve que
// el botón "+" del menú sí agregó el producto. Con el carrito vacío no se
// muestra el número.
// =====================================================================
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSesion } from '../context/SesionContext';
import { useCarrito } from '../context/CarritoContext';
import { COLORES } from '../config/config';

export default function BotonCarrito() {
  const router = useRouter();
  const { usuario } = useSesion();
  const { productos } = useCarrito();

  // Suma de las cantidades de todos los productos del carrito
  const unidades = productos.reduce((suma, p) => suma + p.cantidad, 0);

  return (
    <Pressable
      onPress={() => router.push(usuario ? '/carrito' : '/login')}
      style={({ pressed }) => [estilos.boton, pressed && { opacity: 0.6 }]}
    >
      <Ionicons name="cart-outline" size={24} color={COLORES.crema} />
      {/* El número solo aparece si hay algo en el carrito */}
      {unidades > 0 ? (
        <View style={estilos.circulo}>
          <Text style={estilos.numero}>{unidades}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  boton: { paddingHorizontal: 16 },
  // position: 'absolute' pone el círculo encima del ícono, en la esquina
  circulo: {
    position: 'absolute', top: -6, right: 8,
    backgroundColor: COLORES.terracota, borderRadius: 10,
    minWidth: 20, height: 20, paddingHorizontal: 4,
    alignItems: 'center', justifyContent: 'center',
  },
  numero: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
});
