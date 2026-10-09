// Botón de la app. Con "href" navega a esa pantalla.
// Con "requiereSesion", si no hay sesión lleva a Iniciar sesión
// (regla del mapa de navegación).
import { Pressable, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSesion } from '../context/SesionContext';
import { COLORES } from '../config/config';

// Props (datos que recibe el botón):
//   texto          → lo que dice el botón
//   href           → ruta a la que navega, ej. '/carrito'
//   onPress        → función propia; si se pasa, tiene prioridad sobre href
//   requiereSesion → si no hay sesión, manda a /login en lugar de href
//   variante       → 'primario' (relleno terracota) o 'secundario' (solo borde)
// Uso: <Boton texto="Ver carrito" href="/carrito" requiereSesion />
export default function Boton({ texto, href, onPress, requiereSesion = false, variante = 'primario' }) {
  const router = useRouter();
  const { usuario } = useSesion();

  // Decide qué hacer al tocar, en este orden de prioridad:
  function alTocar() {
    // 1. Si tiene una acción propia, la ejecuta.
    if (onPress) return onPress();
    // 2. Si la pantalla pide sesión y es visitante, lo manda a Iniciar sesión.
    if (requiereSesion && !usuario) return router.push('/login');
    // 3. Si no, navega a la ruta indicada. push = pone la pantalla encima.
    if (href) router.push(href);
  }

  const secundario = variante === 'secundario';
  return (
    // El estilo es una lista: base + secundario (si aplica) + transparencia
    // mientras se mantiene presionado.
    <Pressable
      onPress={alTocar}
      style={({ pressed }) => [estilos.boton, secundario && estilos.secundario, pressed && { opacity: 0.8 }]}
    >
      <Text style={[estilos.texto, secundario && estilos.textoSecundario]}>{texto}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  boton: { backgroundColor: COLORES.terracota, paddingVertical: 14, paddingHorizontal: 18, borderRadius: 6, marginTop: 10 },
  secundario: { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORES.terracota },
  texto: { color: '#FFFFFF', fontWeight: 'bold', textAlign: 'center' },
  textoSecundario: { color: COLORES.terracota },
});
