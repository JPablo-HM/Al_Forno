// =====================================================================
// PANTALLA · Iniciar sesión          Ruta: /login   ·   HU-02, HU-14
// Quién la ve: solo visitantes sin sesión (Perfil → "Iniciar sesión").
// Diseño: mockup HU-02 con los colores de AL FORNO.
//
// Un mismo login para clientes y administradores: el ROL decide a dónde va.
// Al iniciar sesión no hace falta navegar a mano: _layout.js ve que la
// sesión cambió y lleva al cliente a Inicio y al administrador a /admin.
//
// CASCARÓN: valida contra dos usuarios quemados (src/services/auth.js).
//   Cliente: cliente.alforno / cliente123
//   Admin:   admin.alforno   / admin123
// =====================================================================
import { useState } from 'react';
import { ScrollView, View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSesion } from '../context/SesionContext';
import { login } from '../services/auth';
import { COLORES } from '../config/config';

export default function Login() {
  // Del contexto de sesión: guarda al usuario y con eso cambia la navegación.
  const { iniciarSesion } = useSesion();
  // Estado de la pantalla (useState): [valor, función para cambiarlo].
  // Cada vez que un estado cambia, React vuelve a dibujar la pantalla.
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState(false);
  // true → se muestra el recuadro "Correo o contraseña incorrectos."

  // Se ejecuta al tocar "INICIAR SESIÓN" o al dar Enter en la contraseña.
  function alIniciarSesion() {
    // Busca el usuario en la lista de prueba: devuelve el usuario o null.
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

      {/* Solo se dibuja si error es true (condición ? se muestra : null) */}
      {error ? (
        <View style={estilos.error}>
          <Ionicons name="alert-circle-outline" size={20} color={COLORES.texto} />
          <Text style={estilos.errorTexto}>Correo o contraseña incorrectos.</Text>
        </View>
      ) : null}

      {/* Campos "controlados": value muestra el estado y onChangeText lo actualiza
          con cada letra. secureTextEntry oculta la contraseña con puntos. */}
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

      {/* Pressable = elemento que se puede tocar. Al bajar el dedo (pressed)
          se pone un poco transparente como respuesta visual. */}
      <Pressable
        onPress={alIniciarSesion}
        style={({ pressed }) => [estilos.boton, pressed && { opacity: 0.85 }]}
      >
        <Text style={estilos.botonTexto}>INICIAR SESIÓN</Text>
      </Pressable>

      {/* Link navega a /registro (archivo src/app/registro.js) */}
      <Text style={estilos.registro}>
        ¿No tenés cuenta?{' '}
        <Link href="/registro" style={estilos.registroEnlace}>
          Registrate
        </Link>
      </Text>
    </ScrollView>
  );
}

// Estilos de la pantalla. StyleSheet.create los organiza y valida.
// Los colores salen de config.js para que toda la app use la misma paleta.
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
