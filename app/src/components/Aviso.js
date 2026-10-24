// =====================================================================
// COMPONENTE · Aviso (recuadro con ícono y mensaje)
// Lo usan los formularios de la cuenta para mostrar errores de la API
// ("Correo o contraseña incorrectos") o información ("Te enviamos un código").
//
// Props:
//   texto → el mensaje
//   tipo  → 'error' (por defecto), 'info' o 'exito'; solo cambia el ícono
// Uso: {error ? <Aviso texto={error} /> : null}
// =====================================================================
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORES } from '../config/config';

const ICONOS = {
  error: 'alert-circle-outline',
  info: 'information-circle-outline',
  exito: 'checkmark-circle-outline',
};

export default function Aviso({ texto, tipo = 'error' }) {
  return (
    <View style={estilos.caja}>
      <Ionicons name={ICONOS[tipo]} size={20} color={COLORES.texto} />
      <Text style={estilos.texto}>{texto}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  caja: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#EADFD3', borderRadius: 10, padding: 14, marginTop: 12,
  },
  texto: { flex: 1, color: COLORES.texto, fontSize: 15 },
});
