// =====================================================================
// COMPONENTE · Etiqueta del estado del pedido (HU-09)
// "Recibido" en crema con reloj · "Listo para recoger" en terracota con ✓.
// La usan Mis pedidos y el detalle del pedido.
// =====================================================================
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORES } from '../config/config';

export default function EtiquetaEstado({ estado }) {
  const listo = estado === 'Listo para recoger';
  return (
    <View style={[estilos.etiqueta, listo && estilos.listo]}>
      <Ionicons name={listo ? 'checkmark-circle' : 'time-outline'} size={14} color={listo ? '#FFFFFF' : COLORES.texto} />
      <Text style={[estilos.texto, listo && estilos.textoListo]}>{estado}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  etiqueta: {
    flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
    backgroundColor: '#EADFD3', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4,
  },
  listo: { backgroundColor: COLORES.terracota },
  texto: { fontSize: 12, fontWeight: 'bold', color: COLORES.texto },
  textoListo: { color: '#FFFFFF' },
});
