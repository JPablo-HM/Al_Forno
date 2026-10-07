// HU-02 · HU-14 · Iniciar sesión (diseño: mockup HU-02)
// Un mismo login para clientes y administradores: el rol decide a dónde va.
// Al iniciar sesión, la navegación lleva al cliente a Inicio y al
// administrador directo a su panel (ver src/app/_layout.js).
//
// ⚠ CASCARÓN: valida contra dos usuarios quemados (src/services/auth.js).
//   Cliente: cliente@alforno.cr / cliente123
//   Admin:   admin@alforno.cr   / admin123
import { useState } from 'react';
import { ScrollView, View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSesion } from '../context/SesionContext';
import { login } from '../services/auth';
import { COLORES } from '../config/config';

export default function Login() {
  const { iniciarSesion } = useSesion();
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState(false);

  function alIniciarSesion() {
    const usuario = login(correo, contrasena);
    if (!usuario) {
      setError(true);
      return;
    }
    setError(false);
    iniciarSesion(usuario); // la navegación hace el resto según el rol
  }

  return (
    <ScrollView
      style={{ backgroundColor: COLORES.crema }}
      contentContainerStyle={estilos.contenedor}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={estilos.titulo}>Bienvenido de nuevo</Text>
      <Text style={estilos.subtitulo}>Ingresá con tu correo y contraseña.</Text>

      {error ? (
        <View style={estilos.error}>
          <Ionicons name="alert-circle-outline" size={20} color={COLORES.texto} />
          <Text style={estilos.errorTexto}>Correo o contraseña incorrectos.</Text>
        </View>
      ) : null}

      <Text style={estilos.etiqueta}>CORREO</Text>
      <TextInput
        style={estilos.campo}
        value={correo}
        onChangeText={setCorreo}
        placeholder="tucorreo@ejemplo.com"
        placeholderTextColor={COLORES.textoSuave}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Text style={estilos.etiqueta}>CONTRASEÑA</Text>
      <View style={estilos.campoConIcono}>
        <TextInput
          style={estilos.campoTexto}
          value={contrasena}
          onChangeText={setContrasena}
          placeholder="••••••••"
          placeholderTextColor={COLORES.textoSuave}
          secureTextEntry
          autoCapitalize="none"
          onSubmitEditing={alIniciarSesion}
        />
        <Ionicons name="lock-closed-outline" size={20} color={COLORES.texto} />
      </View>

      <Pressable
        onPress={alIniciarSesion}
        style={({ pressed }) => [estilos.boton, pressed && { opacity: 0.85 }]}
      >
        <Text style={estilos.botonTexto}>INICIAR SESIÓN</Text>
      </Pressable>

      <Text style={estilos.registro}>
        ¿No tenés cuenta?{' '}
        <Link href="/registro" style={estilos.registroEnlace}>
          Registrate
        </Link>
      </Text>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { padding: 24, paddingTop: 32 },
  titulo: { fontSize: 30, fontWeight: 'bold', color: COLORES.texto },
  subtitulo: { color: COLORES.textoSuave, marginTop: 6, marginBottom: 20, fontSize: 15 },

  error: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#EADFD3',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  errorTexto: { color: COLORES.texto, fontSize: 15 },

  etiqueta: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1.5, color: COLORES.texto, marginTop: 16, marginBottom: 8 },
  campo: {
    borderWidth: 1,
    borderColor: '#CFC4B8',
    borderRadius: 8,
    backgroundColor: COLORES.cremaClara,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORES.texto,
  },
  campoConIcono: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CFC4B8',
    borderRadius: 8,
    backgroundColor: COLORES.cremaClara,
    paddingHorizontal: 14,
  },
  campoTexto: { flex: 1, paddingVertical: 12, fontSize: 16, color: COLORES.texto },

  boton: { backgroundColor: COLORES.terracota, borderRadius: 8, paddingVertical: 16, marginTop: 28 },
  botonTexto: { color: '#FFFFFF', fontWeight: 'bold', letterSpacing: 1.5, textAlign: 'center', fontSize: 15 },

  registro: { textAlign: 'center', color: COLORES.textoSuave, marginTop: 18, fontSize: 15 },
  registroEnlace: { color: COLORES.texto, fontWeight: 'bold' },
});
