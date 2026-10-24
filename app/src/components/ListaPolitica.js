// =====================================================================
// COMPONENTE · Lista de la política de contraseñas (HU-20)
// Muestra cada regla y la marca con ✓ cuando la contraseña ya la cumple.
// Se vuelve a dibujar en cada letra porque recibe la contraseña del estado
// de la pantalla. La usan Registro, Contraseña vencida, Recuperar y
// Cambiar contraseña.
//
// Props: contrasena → lo que el cliente lleva escrito
// Uso: <ListaPolitica contrasena={form.contrasena} />
// =====================================================================
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { POLITICA_CONTRASENA } from '../utils/contrasena';
import { COLORES } from '../config/config';

export default function ListaPolitica({ contrasena }) {
  return (
    <View style={estilos.lista}>
      {POLITICA_CONTRASENA.map((p) => {
        const cumple = p.regla.test(contrasena);
        return (
          <View key={p.texto} style={estilos.fila}>
            <Ionicons
              name={cumple ? 'checkmark-circle' : 'ellipse-outline'}
              size={18}
              color={cumple ? COLORES.terracota : COLORES.textoSuave}
            />
            <Text style={[estilos.texto, cumple && estilos.cumple]}>{p.texto}</Text>
          </View>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  lista: { marginTop: 10, gap: 6 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  texto: { color: COLORES.textoSuave, fontSize: 14 },
  cumple: { color: COLORES.texto },
});
