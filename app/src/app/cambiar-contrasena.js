// =====================================================================
// PANTALLA · Cambiar contraseña    Ruta: /cambiar-contrasena   ·   HU-20
// Quién la ve: solo clientes con sesión iniciada
// Se llega desde: Perfil → "Cambiar contraseña"
//
// El cliente escribe su contraseña actual y la nueva dos veces. La nueva
// debe cumplir la política (lista con ✓) y no puede ser ninguna de las
// últimas 5; eso último lo revisa la API ("Ya usaste esta contraseña antes").
// Datos: PUT /api/perfil/contrasena (services/perfil.js), con el token.
// =====================================================================
import { useState } from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSesion } from '../context/SesionContext';
import { cambiarContrasena } from '../services/perfil';
import CampoFormulario from '../components/CampoFormulario';
import ListaPolitica from '../components/ListaPolitica';
import Aviso from '../components/Aviso';
import Boton from '../components/Boton';
import { cumplePolitica } from '../utils/contrasena';
import { COLORES } from '../config/config';

export default function CambiarContrasena() {
  const router = useRouter();
  const { token } = useSesion();
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);
  const [enviando, setEnviando] = useState(false);

  async function alGuardar() {
    if (enviando) return;
    setError(null);
    if (nueva !== confirmacion) return setError('Las contraseñas no coinciden');
    setEnviando(true);
    try {
      const { mensaje } = await cambiarContrasena(token, actual, nueva, confirmacion);
      setExito(mensaje);
    } catch (e) {
      setError(e.message); // ej. "La contraseña actual no es correcta"
    } finally {
      setEnviando(false);
    }
  }

  // Al guardar con éxito se muestra el mensaje y un botón para volver.
  if (exito) {
    return (
      <ScrollView style={estilos.fondo} contentContainerStyle={estilos.contenedor}>
        <Aviso tipo="exito" texto={exito} />
        <Boton texto="Volver al perfil" onPress={() => router.back()} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={estilos.fondo} contentContainerStyle={estilos.contenedor} keyboardShouldPersistTaps="handled">
      {error ? <Aviso texto={error} /> : null}
      <CampoFormulario
        etiqueta="CONTRASEÑA ACTUAL"
        icono="lock-closed-outline"
        value={actual}
        onChangeText={setActual}
        secureTextEntry
        autoCapitalize="none"
      />
      <CampoFormulario
        etiqueta="CONTRASEÑA NUEVA"
        icono="lock-closed-outline"
        value={nueva}
        onChangeText={setNueva}
        secureTextEntry
        autoCapitalize="none"
        maxLength={64}
      />
      <ListaPolitica contrasena={nueva} />
      <CampoFormulario
        etiqueta="CONFIRMAR CONTRASEÑA NUEVA"
        icono="lock-closed-outline"
        value={confirmacion}
        onChangeText={setConfirmacion}
        secureTextEntry
        autoCapitalize="none"
        maxLength={64}
      />
      <View style={{ marginTop: 18 }}>
        {/* HU-20: solo se habilita cuando la nueva cumple todas las reglas */}
        <Boton
          texto={enviando ? 'Guardando…' : 'Guardar'}
          onPress={alGuardar}
          deshabilitado={enviando || !actual || !cumplePolitica(nueva)}
        />
      </View>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  fondo: { backgroundColor: COLORES.crema },
  contenedor: { padding: 24, paddingBottom: 48 },
});
