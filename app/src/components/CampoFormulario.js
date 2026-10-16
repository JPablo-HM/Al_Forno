// =====================================================================
// COMPONENTE · Campo de formulario (etiqueta + caja de texto + error)
// Lo usan Registro e Iniciar sesión para que todos los campos se vean igual.
//
// Props:
//   etiqueta → texto de arriba, ej. 'CÉDULA'
//   error    → mensaje en rojo debajo del campo (si no hay, no se muestra)
//   icono    → nombre de un ícono de Ionicons a la derecha (opcional)
//   ...props → todo lo demás pasa directo al TextInput (value,
//              onChangeText, placeholder, keyboardType, secureTextEntry...)
// =====================================================================
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORES } from '../config/config';

export default function CampoFormulario({ etiqueta, error, icono, ...props }) {
  return (
    <View>
      <Text style={estilos.etiqueta}>{etiqueta}</Text>
      {/* Si hay error, el borde se pone terracota */}
      <View style={[estilos.caja, error && estilos.cajaError]}>
        <TextInput
          style={estilos.texto}
          placeholderTextColor={COLORES.textoSuave}
          autoCorrect={false}
          {...props}
        />
        {icono ? <Ionicons name={icono} size={20} color={COLORES.texto} /> : null}
      </View>
      {error ? <Text style={estilos.error}>{error}</Text> : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  etiqueta: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1.5, color: COLORES.texto, marginTop: 16, marginBottom: 8 },
  caja: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CFC4B8',
    borderRadius: 8,
    backgroundColor: COLORES.cremaClara,
    paddingHorizontal: 14,
  },
  cajaError: { borderColor: COLORES.terracota, borderWidth: 2 },
  texto: { flex: 1, paddingVertical: 12, fontSize: 16, color: COLORES.texto },
  error: { color: COLORES.terracotaOscuro, marginTop: 6, fontSize: 13 },
});
