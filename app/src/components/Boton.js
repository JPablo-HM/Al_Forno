// Botón de la app. Con "href" navega a esa pantalla.
// Con "requiereSesion", si no hay sesión lleva a Iniciar sesión
// (regla del mapa de navegación).
import { Pressable, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSesion } from '../context/SesionContext';
import { COLORES } from '../config/config';

export default function Boton({ texto, href, onPress, requiereSesion = false, variante = 'primario' }) {
  const router = useRouter();
  const { usuario } = useSesion();

  function alTocar() {
    if (onPress) return onPress();
    if (requiereSesion && !usuario) return router.push('/login');
    if (href) router.push(href);
  }

  const secundario = variante === 'secundario';
  return (
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
