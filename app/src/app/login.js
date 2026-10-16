// =====================================================================
// PANTALLA · Iniciar sesión          Ruta: /login   ·   HU-02, HU-14
// Quién la ve: solo visitantes sin sesión (Perfil → "Iniciar sesión", o al
// tocar algo que pide sesión, como el "+" del menú).
//
// Un mismo login para clientes y administradores: el ROL decide a dónde va.
// Al iniciar sesión no hace falta navegar a mano: _layout.js ve que la
// sesión cambió y lleva al cliente a Inicio y al administrador a /admin.
//
// Datos: POST /api/auth/login (services/auth.js). La API compara la
// contraseña con bcrypt y devuelve el usuario y su token.
// Administrador de la base: admin@alforno.cr / Cambiar.AlForno2026
// =====================================================================
import { useState } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSesion } from '../context/SesionContext';
import { login } from '../services/auth';
import CampoFormulario from '../components/CampoFormulario';
import { COLORES } from '../config/config';

export default function Login() {
  // Del contexto de sesión: guarda al usuario y con eso cambia la navegación.
  const { iniciarSesion } = useSesion();

  // Estado de la pantalla (useState): [valor, función para cambiarlo].
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState(null);       // mensaje del recuadro de error
  const [enviando, setEnviando] = useState(false); // true mientras espera a la API

  // Se ejecuta al tocar "INICIAR SESIÓN" o al dar Enter en la contraseña.
  // async: espera la respuesta de la API sin congelar la pantalla.
  async function alIniciarSesion() {
    if (enviando) return; // evita enviar dos veces
    setError(null);
    setEnviando(true);
    try {
      const { usuario, token } = await login(correo, contrasena);
      iniciarSesion(usuario, token); // la navegación hace el resto según el rol
    } catch (e) {
      // Mensaje de la API: "Correo o contraseña incorrectos" (sin decir cuál
      // de los dos falló, HU-02), o "No se pudo conectar con el servidor".
      setError(e.message);
      setEnviando(false);
    }
  }

  return (
    <ScrollView
      style={{ backgroundColor: COLORES.crema }}
      contentContainerStyle={estilos.contenedor}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={estilos.titulo}>Bienvenido de nuevo</Text>
      <Text style={estilos.subtitulo}>Ingresá con tu correo y contraseña.</Text>

      {/* Solo se dibuja si hay error (condición ? se muestra : null) */}
      {error ? (
        <View style={estilos.error}>
          <Ionicons name="alert-circle-outline" size={20} color={COLORES.texto} />
          <Text style={estilos.errorTexto}>{error}</Text>
        </View>
      ) : null}

      {/* Campos "controlados": value muestra el estado y onChangeText lo actualiza */}
      <CampoFormulario
        etiqueta="CORREO"
        value={correo}
        onChangeText={setCorreo}
        placeholder="tucorreo@ejemplo.com"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <CampoFormulario
        etiqueta="CONTRASEÑA"
        icono="lock-closed-outline"
        value={contrasena}
        onChangeText={setContrasena}
        placeholder="••••••••"
        secureTextEntry
        autoCapitalize="none"
        onSubmitEditing={alIniciarSesion}
      />

      <Pressable
        onPress={alIniciarSesion}
        disabled={enviando}
        style={({ pressed }) => [estilos.boton, (pressed || enviando) && { opacity: 0.7 }]}
      >
        <Text style={estilos.botonTexto}>{enviando ? 'INGRESANDO…' : 'INICIAR SESIÓN'}</Text>
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

const estilos = StyleSheet.create({
  contenedor: { padding: 24, paddingTop: 32 },
  titulo: { fontSize: 30, fontWeight: 'bold', color: COLORES.texto },
  subtitulo: { color: COLORES.textoSuave, marginTop: 6, marginBottom: 12, fontSize: 15 },
  error: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#EADFD3', borderRadius: 10, padding: 14, marginBottom: 4,
  },
  errorTexto: { flex: 1, color: COLORES.texto, fontSize: 15 },
  boton: { backgroundColor: COLORES.terracota, borderRadius: 8, paddingVertical: 16, marginTop: 28 },
  botonTexto: { color: '#FFFFFF', fontWeight: 'bold', letterSpacing: 1.5, textAlign: 'center', fontSize: 15 },
  registro: { textAlign: 'center', color: COLORES.textoSuave, marginTop: 18, fontSize: 15 },
  registroEnlace: { color: COLORES.texto, fontWeight: 'bold' },
});
