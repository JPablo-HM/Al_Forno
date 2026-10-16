// =====================================================================
// PANTALLA · Crear cuenta
// Ruta: /registro   ·   Historia: HU-01
// Quién la ve: solo visitantes sin sesión
// Se llega desde: Perfil → "Crear cuenta" o el enlace "Registrate" del login
// Lleva a: Inicio (al crear la cuenta queda con la sesión iniciada)
//
// Datos: POST /api/auth/registro (services/auth.js).
// Las reglas se revisan DOS veces:
//   1. Aquí, antes de enviar, para avisar rápido campo por campo.
//   2. En la API (express-validator), que es la que manda: aunque alguien
//      se salte la app, la API no acepta datos inválidos.
// La API además revisa que el correo y la cédula no estén repetidos (409).
// =====================================================================
import { useState } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSesion } from '../context/SesionContext';
import { registrar } from '../services/auth';
import CampoFormulario from '../components/CampoFormulario';
import { COLORES } from '../config/config';

// Campos del formulario. Todos empiezan vacíos.
const VACIO = { nombre_completo: '', cedula: '', telefono: '', correo: '', contrasena: '', confirmar: '' };

// HU-01 · Revisa los datos y devuelve { campo: 'mensaje' } con los errores.
// Si devuelve un objeto vacío, todo está bien.
function validarFormulario(f) {
  const errores = {};
  if (!f.nombre_completo.trim()) errores.nombre_completo = 'Escribe tu nombre completo';
  // /^\d{9}$/ = exactamente 9 dígitos, nada más
  if (!/^\d{9}$/.test(f.cedula)) errores.cedula = 'La cédula debe tener 9 dígitos';
  if (!/^\d{8}$/.test(f.telefono)) errores.telefono = 'El teléfono debe tener 8 dígitos';
  // algo@algo.algo
  if (!/^\S+@\S+\.\S+$/.test(f.correo.trim())) errores.correo = 'Escribe un correo válido';
  if (f.contrasena.length < 8) errores.contrasena = 'La contraseña debe tener al menos 8 caracteres';
  if (f.confirmar !== f.contrasena) errores.confirmar = 'Las contraseñas no coinciden';
  return errores;
}

export default function Registro() {
  const { iniciarSesion } = useSesion();
  const [form, setForm] = useState(VACIO);
  const [errores, setErrores] = useState({});        // errores por campo
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [enviando, setEnviando] = useState(false);

  // Devuelve la función que actualiza UN campo y borra su error.
  // Ej.: cambiar('cedula') → (texto) => guarda texto en form.cedula
  const cambiar = (campo) => (texto) => {
    setForm((actual) => ({ ...actual, [campo]: texto }));
    setErrores((actual) => ({ ...actual, [campo]: null }));
  };

  async function alCrearCuenta() {
    if (enviando) return;
    setErrorGeneral(null);

    // 1. Revisión en la app: si algo está mal, se marca y no se envía.
    const encontrados = validarFormulario(form);
    if (Object.keys(encontrados).length > 0) {
      setErrores(encontrados);
      return;
    }

    // 2. Envío a la API. "confirmar" no se manda: solo sirve en la app.
    setEnviando(true);
    try {
      const { confirmar: _, ...datos } = form;
      const { usuario, token } = await registrar(datos);
      // HU-01: al terminar queda con la sesión iniciada. _layout.js lo lleva a Inicio.
      iniciarSesion(usuario, token);
    } catch (e) {
      // Si la API dice qué campo falló, se marca ese campo;
      // si no (ej. sin conexión), se muestra arriba.
      if (e.campo) setErrores({ [e.campo]: e.message });
      else if (e.message.includes('correo')) setErrores({ correo: e.message });
      else if (e.message.includes('cédula')) setErrores({ cedula: e.message });
      else setErrorGeneral(e.message);
      setEnviando(false);
    }
  }

  return (
    <ScrollView
      style={{ backgroundColor: COLORES.crema }}
      contentContainerStyle={estilos.contenedor}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={estilos.titulo}>Crear cuenta</Text>
      <Text style={estilos.subtitulo}>Tus datos quedan guardados para tus pedidos y reservas.</Text>

      {errorGeneral ? (
        <View style={estilos.error}>
          <Ionicons name="alert-circle-outline" size={20} color={COLORES.texto} />
          <Text style={estilos.errorTexto}>{errorGeneral}</Text>
        </View>
      ) : null}

      <CampoFormulario
        etiqueta="NOMBRE COMPLETO"
        value={form.nombre_completo}
        onChangeText={cambiar('nombre_completo')}
        placeholder="Nombre y apellidos"
        autoCapitalize="words"
        error={errores.nombre_completo}
      />
      <CampoFormulario
        etiqueta="CÉDULA"
        value={form.cedula}
        onChangeText={cambiar('cedula')}
        placeholder="9 dígitos, sin guiones"
        keyboardType="number-pad"
        maxLength={9}
        error={errores.cedula}
      />
      <CampoFormulario
        etiqueta="TELÉFONO"
        value={form.telefono}
        onChangeText={cambiar('telefono')}
        placeholder="8 dígitos"
        keyboardType="number-pad"
        maxLength={8}
        error={errores.telefono}
      />
      <CampoFormulario
        etiqueta="CORREO"
        value={form.correo}
        onChangeText={cambiar('correo')}
        placeholder="tucorreo@ejemplo.com"
        keyboardType="email-address"
        autoCapitalize="none"
        error={errores.correo}
      />
      <CampoFormulario
        etiqueta="CONTRASEÑA"
        icono="lock-closed-outline"
        value={form.contrasena}
        onChangeText={cambiar('contrasena')}
        placeholder="Mínimo 8 caracteres"
        secureTextEntry
        autoCapitalize="none"
        error={errores.contrasena}
      />
      <CampoFormulario
        etiqueta="CONFIRMAR CONTRASEÑA"
        icono="lock-closed-outline"
        value={form.confirmar}
        onChangeText={cambiar('confirmar')}
        placeholder="Escribila de nuevo"
        secureTextEntry
        autoCapitalize="none"
        onSubmitEditing={alCrearCuenta}
        error={errores.confirmar}
      />

      <Pressable
        onPress={alCrearCuenta}
        disabled={enviando}
        style={({ pressed }) => [estilos.boton, (pressed || enviando) && { opacity: 0.7 }]}
      >
        <Text style={estilos.botonTexto}>{enviando ? 'CREANDO…' : 'CREAR CUENTA'}</Text>
      </Pressable>

      <Text style={estilos.pie}>
        ¿Ya tenés cuenta?{' '}
        <Link href="/login" style={estilos.enlace}>
          Iniciá sesión
        </Link>
      </Text>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { padding: 24, paddingTop: 32, paddingBottom: 48 },
  titulo: { fontSize: 30, fontWeight: 'bold', color: COLORES.texto },
  subtitulo: { color: COLORES.textoSuave, marginTop: 6, marginBottom: 8, fontSize: 15 },
  error: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#EADFD3', borderRadius: 10, padding: 14, marginTop: 8,
  },
  errorTexto: { flex: 1, color: COLORES.texto, fontSize: 15 },
  boton: { backgroundColor: COLORES.terracota, borderRadius: 8, paddingVertical: 16, marginTop: 28 },
  botonTexto: { color: '#FFFFFF', fontWeight: 'bold', letterSpacing: 1.5, textAlign: 'center', fontSize: 15 },
  pie: { textAlign: 'center', color: COLORES.textoSuave, marginTop: 18, fontSize: 15 },
  enlace: { color: COLORES.texto, fontWeight: 'bold' },
});
