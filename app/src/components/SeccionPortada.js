// =====================================================================
// SECCIÓN · Portada (encabezado de la pantalla Inicio)
// Igual que el inicio de la página web: nombre, lema, descripción y la
// imagen del horno. Es información fija: no pide datos a la API.
//
// La imagen está en app/assets/horno.png (fondo transparente). El texto
// se escribe con <Text> (no va dentro de la imagen) para que se vea
// nítido en cualquier teléfono y se pueda cambiar fácil.
// =====================================================================
import { View, Text, Image, Platform, StyleSheet } from 'react-native';
import { COLORES } from '../config/config';

// Letra con remates (serif) para el nombre y el lema, como en la web.
// Cada sistema tiene la suya: iPhone → Georgia, Android → serif.
const LETRA_SERIF = Platform.select({ ios: 'Georgia', default: 'serif' });

export default function SeccionPortada() {
  return (
    <View style={estilos.portada}>
      <Text style={estilos.etiqueta}>PIZZERÍA · CUCINA · BAR</Text>

      {/* Fila: a la izquierda el nombre y el lema; a la derecha el horno */}
      <View style={estilos.fila}>
        <View style={estilos.columnaTexto}>
          <Text style={estilos.nombre}>AL{'\n'}FORNO</Text>
          <Text style={estilos.lema}>Pizza artesanal{'\n'}al fuego</Text>
        </View>
        {/* require() incluye la imagen dentro de la app al compilarla */}
        <Image source={require('../../assets/horno.png')} style={estilos.horno} resizeMode="contain" />
      </View>

      <Text style={estilos.descripcion}>
        Masa de fermentación lenta, ingredientes frescos y un horno de leña que marca el ritmo
        de la casa. Cocina italiana, cócteles clásicos y cerveza fría en un ambiente cálido.
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  portada: { backgroundColor: COLORES.negro, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 28 },
  etiqueta: { color: COLORES.terracotaClaro, fontFamily: LETRA_SERIF, fontSize: 11, letterSpacing: 3 },
  fila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 6 },
  columnaTexto: { flex: 1, marginRight: 12 },
  nombre: { color: COLORES.crema, fontFamily: LETRA_SERIF, fontWeight: 'bold', fontSize: 40, lineHeight: 46, letterSpacing: 3 },
  lema: { color: COLORES.terracotaClaro, fontFamily: LETRA_SERIF, fontStyle: 'italic', fontSize: 20, lineHeight: 26, marginTop: 8 },
  // La imagen mide 760 × 812: el alto se calcula con esa proporción.
  horno: { width: 120, height: 128 },
  descripcion: { color: '#D8CFC4', fontSize: 14, lineHeight: 21, marginTop: 14 },
});
