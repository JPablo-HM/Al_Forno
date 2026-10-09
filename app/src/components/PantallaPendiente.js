// Plantilla temporal para las pantallas que todavía no se construyen.
// Muestra la historia de usuario, qué hará la pantalla y los botones para
// seguir el flujo del mapa de navegación. Se reemplaza al construir cada pantalla.
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { COLORES } from '../config/config';

// Props: hu (número de historia), titulo, descripcion y children.
// children = lo que se escribe entre <PantallaPendiente> y </PantallaPendiente>
// (los botones del flujo).
export default function PantallaPendiente({ hu, titulo, descripcion, children }) {
  return (
    <ScrollView style={{ backgroundColor: COLORES.crema }} contentContainerStyle={estilos.contenedor}>
      {/* Si hay número de historia lo muestra; si no, no dibuja nada (null) */}
      {hu ? <Text style={estilos.hu}>{hu}</Text> : null}
      <Text style={estilos.titulo}>{titulo}</Text>
      {descripcion ? <Text style={estilos.descripcion}>{descripcion}</Text> : null}
      <View style={estilos.aviso}>
        <Text style={estilos.avisoTexto}>Pantalla en construcción</Text>
      </View>
      <View>{children}</View>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { padding: 20, paddingBottom: 40 },
  hu: { color: COLORES.terracota, fontWeight: 'bold', letterSpacing: 2, marginBottom: 4 },
  titulo: { fontSize: 26, fontWeight: 'bold', color: COLORES.texto },
  descripcion: { color: COLORES.textoSuave, marginTop: 8, lineHeight: 21 },
  aviso: { borderWidth: 1, borderStyle: 'dashed', borderColor: COLORES.textoSuave, borderRadius: 6, padding: 10, marginVertical: 16 },
  avisoTexto: { color: COLORES.textoSuave, textAlign: 'center', fontSize: 12 },
});
