// =====================================================================
// PANTALLA · Crear cuenta
// Ruta: /registro   ·   Historias: HU-01, HU-20
// Quién la ve: solo visitantes sin sesión
// Se llega desde: Perfil → "Crear cuenta" o el enlace "Registrate" del login
//
// Tiene DOS vistas según el estado "enviado":
//   1. El formulario: datos personales, contraseña con la política en vivo
//      (lista con ✓, HU-20) y 3 preguntas de seguridad con su respuesta.
//   2. "Revisá tu correo": la cuenta queda Pendiente de verificación hasta
//      que el cliente abra el link del correo (HU-01). NO inicia sesión.
//
// Datos: GET /api/auth/preguntas y POST /api/auth/registro (services/auth.js).
// Las reglas se revisan DOS veces:
//   1. Aquí, antes de enviar, para avisar rápido campo por campo.
//   2. En la API (express-validator), que es la que manda: aunque alguien
//      se salte la app, la API no acepta datos inválidos.
// La API además revisa que el correo y la cédula no estén repetidos (409).
// =====================================================================
import { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { obtenerPreguntas, registrar, reenviarVerificacion } from '../services/auth';
import CampoFormulario from '../components/CampoFormulario';
import ListaPolitica from '../components/ListaPolitica';
import Aviso from '../components/Aviso';
import Opcion from '../components/Opcion';
import Boton from '../components/Boton';
import { cumplePolitica } from '../utils/contrasena';
import { COLORES } from '../config/config';

// Campos del formulario. Todos empiezan vacíos.
const VACIO = { nombre_completo: '', cedula: '', telefono: '', correo: '', contrasena: '', confirmacion: '' };

// HU-01 · Revisa los datos y devuelve { campo: 'mensaje' } con los errores.
// respuestas = [{ pregunta_id, respuesta }] con las preguntas elegidas.
// Si devuelve un objeto vacío, todo está bien.
function validarFormulario(f, respuestas) {
  const errores = {};
  if (!f.nombre_completo.trim()) errores.nombre_completo = 'Escribe tu nombre completo';
  // /^\d{9}$/ = exactamente 9 dígitos, nada más
  if (!/^\d{9}$/.test(f.cedula)) errores.cedula = 'La cédula debe tener 9 dígitos';
  if (!/^\d{8}$/.test(f.telefono)) errores.telefono = 'El teléfono debe tener 8 dígitos';
  // algo@algo.algo
  if (!/^\S+@\S+\.\S+$/.test(f.correo.trim())) errores.correo = 'Escribe un correo válido';
  // HU-20: las 5 reglas de la política (utils/contrasena.js)
  if (!cumplePolitica(f.contrasena)) errores.contrasena = 'La contraseña no cumple todas las reglas';
  if (f.confirmacion !== f.contrasena) errores.confirmacion = 'Las contraseñas no coinciden';
  // HU-01: 3 preguntas, cada una con respuesta
  if (respuestas.length !== 3) errores.preguntas = 'Elige 3 preguntas de seguridad';
  else if (respuestas.some((r) => !r.respuesta.trim())) errores.respuestas = 'Responde las 3 preguntas';
  return errores;
}

export default function Registro() {
  const router = useRouter();
  const [form, setForm] = useState(VACIO);
  const [preguntas, setPreguntas] = useState([]);     // las de la API: [{ id, texto }]
  const [respuestas, setRespuestas] = useState([]);   // las elegidas: [{ pregunta_id, respuesta }]
  const [errores, setErrores] = useState({});         // errores por campo
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [enviando, setEnviando] = useState(false);
  // null = formulario · { correo, mensaje } = cuenta creada, falta verificar
  const [enviado, setEnviado] = useState(null);
  const [avisoReenvio, setAvisoReenvio] = useState(null);

  // Al abrir la pantalla se piden las preguntas a la API.
  // [] = solo una vez, al abrir.
  useEffect(() => {
    obtenerPreguntas()
      .then(setPreguntas)
      .catch((e) => setErrorGeneral(e.message));
  }, []);

  // Devuelve la función que actualiza UN campo y borra su error.
  // Ej.: cambiar('cedula') → (texto) => guarda texto en form.cedula
  const cambiar = (campo) => (texto) => {
    setForm((actual) => ({ ...actual, [campo]: texto }));
    setErrores((actual) => ({ ...actual, [campo]: null }));
  };

  // Tocar una pregunta: si ya estaba elegida se quita; si no, se agrega
  // (máximo 3). filter() devuelve la lista sin la pregunta tocada.
  function alTocarPregunta(id) {
    setErrores((actual) => ({ ...actual, preguntas: null }));
    setRespuestas((actual) => {
      if (actual.some((r) => r.pregunta_id === id)) return actual.filter((r) => r.pregunta_id !== id);
      if (actual.length === 3) return actual; // ya tiene 3: no agrega más
      return [...actual, { pregunta_id: id, respuesta: '' }];
    });
  }

  // Escribir la respuesta de una pregunta elegida.
  // map() devuelve la lista con esa respuesta cambiada y las demás igual.
  function alResponder(id, texto) {
    setErrores((actual) => ({ ...actual, respuestas: null }));
    setRespuestas((actual) => actual.map((r) => (r.pregunta_id === id ? { ...r, respuesta: texto } : r)));
  }

  async function alCrearCuenta() {
    if (enviando) return;
    setErrorGeneral(null);

    // 1. Revisión en la app: si algo está mal, se marca y no se envía.
    const encontrados = validarFormulario(form, respuestas);
    if (Object.keys(encontrados).length > 0) {
      setErrores(encontrados);
      return;
    }

    // 2. Envío a la API: los datos del formulario + las 3 respuestas.
    setEnviando(true);
    try {
      const resultado = await registrar({ ...form, respuestas });
      setEnviado(resultado); // cambia a la vista "Revisá tu correo"
    } catch (e) {
      // Si la API dice qué campo falló (error 400), se marca ese campo.
      // Si no (ej. "Ese correo ya está registrado" o sin conexión), el
      // mensaje se muestra junto al botón.
      if (e.campo?.startsWith('respuestas')) setErrores({ respuestas: e.message });
      else if (e.campo) setErrores({ [e.campo]: e.message });
      else setErrorGeneral(e.message);
    } finally {
      setEnviando(false);
    }
  }

  async function alReenviar() {
    try {
      const { mensaje } = await reenviarVerificacion(enviado.correo);
      setAvisoReenvio(mensaje);
    } catch (e) {
      setAvisoReenvio(e.message);
    }
  }

  // Vista 2: cuenta creada, falta confirmar el correo (HU-01).
  if (enviado) {
    return (
      <ScrollView style={{ backgroundColor: COLORES.crema }} contentContainerStyle={estilos.contenedor}>
        <Text style={estilos.titulo}>Revisá tu correo</Text>
        <Text style={estilos.subtitulo}>Enviamos un link a {enviado.correo}.</Text>
        <Aviso tipo="info" texto={enviado.mensaje} />
        <Text style={estilos.nota}>El link vence en 24 horas. Después de abrirlo ya podés iniciar sesión.</Text>
        {avisoReenvio ? <Aviso tipo="info" texto={avisoReenvio} /> : null}
        <View style={{ marginTop: 16 }}>
          <Boton texto="Ir a iniciar sesión" onPress={() => router.replace('/login')} />
          <Boton texto="Reenviar correo" variante="secundario" onPress={alReenviar} />
        </View>
      </ScrollView>
    );
  }

  // HU-20: el botón solo se habilita cuando la contraseña cumple la política.
  const puedeEnviar = cumplePolitica(form.contrasena) && !enviando;

  // Vista 1: el formulario.
  return (
    <ScrollView
      style={{ backgroundColor: COLORES.crema }}
      contentContainerStyle={estilos.contenedor}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={estilos.titulo}>Crear cuenta</Text>
      <Text style={estilos.subtitulo}>Tus datos quedan guardados para tus pedidos y reservas.</Text>

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
        placeholder="Escribí una contraseña segura"
        secureTextEntry
        autoCapitalize="none"
        maxLength={64}
        error={errores.contrasena}
      />
      {/* HU-20: cada regla se marca con ✓ mientras escribe */}
      <ListaPolitica contrasena={form.contrasena} />
      <CampoFormulario
        etiqueta="CONFIRMAR CONTRASEÑA"
        icono="lock-closed-outline"
        value={form.confirmacion}
        onChangeText={cambiar('confirmacion')}
        placeholder="Escribila de nuevo"
        secureTextEntry
        autoCapitalize="none"
        maxLength={64}
        error={errores.confirmacion}
      />

      {/* HU-01: preguntas de seguridad (se usan para recuperar la contraseña) */}
      <Text style={estilos.seccion}>PREGUNTAS DE SEGURIDAD</Text>
      <Text style={estilos.nota}>Elegí 3 ({respuestas.length} de 3). Te las vamos a pedir si olvidás tu contraseña.</Text>
      <View style={estilos.preguntas}>
        {preguntas.map((p) => (
          <Opcion
            key={p.id}
            texto={p.texto}
            seleccionada={respuestas.some((r) => r.pregunta_id === p.id)}
            onPress={() => alTocarPregunta(p.id)}
          />
        ))}
      </View>
      {errores.preguntas ? <Text style={estilos.error}>{errores.preguntas}</Text> : null}

      {/* Un campo de respuesta por cada pregunta elegida, en el orden en que se eligieron */}
      {respuestas.map((r) => (
        <CampoFormulario
          key={r.pregunta_id}
          etiqueta={preguntas.find((p) => p.id === r.pregunta_id)?.texto.toUpperCase()}
          value={r.respuesta}
          onChangeText={(texto) => alResponder(r.pregunta_id, texto)}
          placeholder="Tu respuesta"
          maxLength={100}
        />
      ))}
      {errores.respuestas ? <Text style={estilos.error}>{errores.respuestas}</Text> : null}

      {/* Errores generales (correo o cédula repetidos, sin conexión) junto al botón, donde el cliente los ve */}
      {errorGeneral ? <Aviso texto={errorGeneral} /> : null}

      <View style={{ marginTop: 18 }}>
        <Boton texto={enviando ? 'Creando…' : 'Crear cuenta'} onPress={alCrearCuenta} deshabilitado={!puedeEnviar} />
      </View>

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
  seccion: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1.5, color: COLORES.terracota, marginTop: 28 },
  nota: { color: COLORES.textoSuave, marginTop: 8, fontSize: 14 },
  preguntas: { gap: 8, marginTop: 12 },
  error: { color: COLORES.terracotaOscuro, marginTop: 6, fontSize: 13 },
  pie: { textAlign: 'center', color: COLORES.textoSuave, marginTop: 18, fontSize: 15 },
  enlace: { color: COLORES.texto, fontWeight: 'bold' },
});
