// =====================================================================
// COMPONENTE · Opción seleccionable (botón tipo "chip")
// Se usa en Nueva reserva para escoger día, hora y motivo.
// Props: texto, subtexto (opcional, línea pequeña debajo), seleccionada,
//        deshabilitada (se ve tenue y no se puede tocar), onPress.
// =====================================================================
import { Pressable, Text, StyleSheet } from 'react-native';
import { COLORES } from '../config/config';

export default function Opcion({ texto, subtexto, seleccionada, deshabilitada, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={deshabilitada}
      style={[estilos.opcion, seleccionada && estilos.seleccionada, deshabilitada && estilos.deshabilitada]}
    >
      <Text style={[estilos.texto, seleccionada && estilos.textoSel]}>{texto}</Text>
      {subtexto ? <Text style={[estilos.subtexto, seleccionada && estilos.textoSel]}>{subtexto}</Text> : null}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  opcion: {
    borderWidth: 1, borderColor: '#CFC4B8', backgroundColor: COLORES.cremaClara,
    borderRadius: 8, paddingVertical: 10, paddingHorizontal: 14, alignItems: 'center', minWidth: 72,
  },
  seleccionada: { backgroundColor: COLORES.terracota, borderColor: COLORES.terracota },
  deshabilitada: { opacity: 0.4 },
  texto: { color: COLORES.texto, fontWeight: 'bold' },
  subtexto: { color: COLORES.textoSuave, fontSize: 11, marginTop: 2 },
  textoSel: { color: '#FFFFFF' },
});
