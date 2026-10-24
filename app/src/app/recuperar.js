// =====================================================================
// PANTALLA · Recuperar contraseña     Ruta: /recuperar   ·   HU-22, HU-20
// Quién la ve: solo visitantes sin sesión
// Se llega desde: Iniciar sesión → "¿Olvidaste tu contraseña?"
//
// Igual que el login, va en PASOS guardados en el estado "paso":
//   'CORREO'    → el cliente escribe su correo
//   'VERIFICAR' → comprueba que es el dueño: responde sus 3 preguntas de
//                 seguridad, o (si lo vinculó) escribe el código de
//                 Google Authenticator
//   'NUEVA'     → escribe la contraseña nueva con la política en vivo (HU-20)
//   'LISTO'     → mensaje final y botón para iniciar sesión
// Cada paso recibe de la API un "pase" (token temporal) para el siguiente.
// Las respuestas incorrectas cuentan para el bloqueo de 3 intentos (HU-02).
// Al terminar, la API avisa por correo que la contraseña cambió.
//
// Datos: services/recuperacion.js (POST /api/recuperacion/...).
// =====================================================================
import { useState } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { iniciarRecuperacion, verificarIdentidad, guardarNuevaContrasena } from '../services/recuperacion';
import CampoFormulario from '../components/CampoFormulario';
import ListaPolitica from '../components/ListaPolitica';
import Aviso from '../components/Aviso';
import Opcion from '../components/Opcion';
import Boton from '../components/Boton';
import { cumplePolitica } from '../utils/contrasena';
import { COLORES } from '../config/config';

export default function Recuperar() {
  const router = useRouter();
  const [paso, setPaso] = useState('CORREO');
  const [correo, setCorreo] = useState('');
  const [pase, setPase] = useState(null);
  const [metodos, setMetodos] = useState([]);        // ['PREGUNTAS'] o ['PREGUNTAS', 'AUTENTICADOR']
  const [metodo, setMetodo] = useState('PREGUNTAS');
  const [respuestas, setRespuestas] = useState([]);  // [{ pregunta_id, texto, respuesta }]
  const [codigo, setCodigo] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [mensajeFinal, setMensajeFinal] = useState(null);
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  // Manejo común: evita enviar dos veces y muestra el error de la API.
  async function llamar(accion) {
    if (enviando) return;
    setError(null);
    setEnviando(true);
    try {
      await accion();
    } catch (e) {
      setError(e.message);
      // 423 = bloqueada por 3 intentos (HU-02): el pase ya no sirve.
      if (e.status === 423) setPaso('CORREO');
    } finally {
      setEnviando(false);
    }
  }

  // Paso 1 · El correo. La API devuelve las 3 preguntas del cliente.
  function alContinuarCorreo() {
    llamar(async () => {
      const r = await iniciarRecuperacion(correo);
      setPase(r.pase);
      setMetodos(r.metodos);
      setMetodo('PREGUNTAS');
      // Cada pregunta con su respuesta vacía, lista para escribir.
      setRespuestas(r.preguntas.map((p) => ({ ...p, respuesta: '' })));
      setPaso('VERIFICAR');
    });
  }

  // Escribir la respuesta de una pregunta (map cambia solo esa).
  function alResponder(id, texto) {
    setRespuestas((actual) => actual.map((r) => (r.pregunta_id === id ? { ...r, respuesta: texto } : r)));
  }

  // Paso 2 · Comprobar que es el dueño de la cuenta.
  function alVerificar() {
    // A la API solo van el id y la respuesta (el texto no hace falta).
    const datos = metodo === 'PREGUNTAS'
      ? { metodo, respuestas: respuestas.map(({ pregunta_id, respuesta }) => ({ pregunta_id, respuesta })) }
      : { metodo, codigo };
    llamar(async () => {
      const r = await verificarIdentidad(pase, datos);
      setPase(r.pase);
      setPaso('NUEVA');
    });
  }

  // Paso 3 · La contraseña nueva (HU-20).
  function alGuardar() {
    if (nueva !== confirmacion) return setError('Las contraseñas no coinciden');
    llamar(async () => {
      const { mensaje } = await guardarNuevaContrasena(pase, nueva, confirmacion);
      setMensajeFinal(mensaje);
      setPaso('LISTO');
    });
  }

  // El botón del paso 2 se habilita cuando todo está escrito.
  const verificacionCompleta = metodo === 'PREGUNTAS'
    ? respuestas.every((r) => r.respuesta.trim())
    : codigo.length === 6;

  return (
    <ScrollView
      style={{ backgroundColor: COLORES.crema }}
      contentContainerStyle={estilos.contenedor}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={estilos.titulo}>Recuperar contraseña</Text>
      {error ? <Aviso texto={error} /> : null}

      {/* ---------- Paso 1 · Correo ---------- */}
      {paso === 'CORREO' && (
        <>
          <Text style={estilos.subtitulo}>Escribí el correo de tu cuenta.</Text>
          <CampoFormulario
            etiqueta="CORREO"
            value={correo}
            onChangeText={setCorreo}
            placeholder="tucorreo@ejemplo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            onSubmitEditing={alContinuarCorreo}
          />
          <Boton texto="Continuar" onPress={alContinuarCorreo} deshabilitado={enviando || !correo.trim()} />
        </>
      )}

      {/* ---------- Paso 2 · Comprobar que es el dueño ---------- */}
      {paso === 'VERIFICAR' && (
        <>
          <Text style={estilos.subtitulo}>Comprobá que sos el dueño de la cuenta.</Text>

          {/* Solo si vinculó Google Authenticator puede elegir */}
          {metodos.length > 1 ? (
            <View style={estilos.opciones}>
              <Opcion texto="Preguntas de seguridad" seleccionada={metodo === 'PREGUNTAS'} onPress={() => setMetodo('PREGUNTAS')} />
              <Opcion texto="Google Authenticator" seleccionada={metodo === 'AUTENTICADOR'} onPress={() => setMetodo('AUTENTICADOR')} />
            </View>
          ) : null}

          {metodo === 'PREGUNTAS'
            ? respuestas.map((r) => (
                <CampoFormulario
                  key={r.pregunta_id}
                  etiqueta={r.texto.toUpperCase()}
                  value={r.respuesta}
                  onChangeText={(texto) => alResponder(r.pregunta_id, texto)}
                  placeholder="Tu respuesta"
                  maxLength={100}
                />
              ))
            : (
              <CampoFormulario
                etiqueta="CÓDIGO DE GOOGLE AUTHENTICATOR"
                value={codigo}
                onChangeText={setCodigo}
                placeholder="6 dígitos"
                keyboardType="number-pad"
                maxLength={6}
              />
            )}

          <Boton texto="Continuar" onPress={alVerificar} deshabilitado={enviando || !verificacionCompleta} />
        </>
      )}

      {/* ---------- Paso 3 · Contraseña nueva (HU-20) ---------- */}
      {paso === 'NUEVA' && (
        <>
          <Text style={estilos.subtitulo}>Creá tu contraseña nueva.</Text>
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
            etiqueta="CONFIRMAR CONTRASEÑA"
            icono="lock-closed-outline"
            value={confirmacion}
            onChangeText={setConfirmacion}
            secureTextEntry
            autoCapitalize="none"
            maxLength={64}
          />
          <Boton texto="Guardar" onPress={alGuardar} deshabilitado={enviando || !cumplePolitica(nueva)} />
        </>
      )}

      {/* ---------- Paso 4 · Listo ---------- */}
      {paso === 'LISTO' && (
        <>
          <Aviso tipo="exito" texto={mensajeFinal} />
          <Boton texto="Ir a iniciar sesión" onPress={() => router.replace('/login')} />
        </>
      )}

      {/* En los pasos 2 y 3 se puede empezar de nuevo */}
      {paso === 'VERIFICAR' || paso === 'NUEVA' ? (
        <Pressable onPress={() => { setPaso('CORREO'); setError(null); }}>
          <Text style={estilos.enlaceCentro}>Volver</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}


const estilos = StyleSheet.create({
  contenedor: { padding: 24, paddingTop: 32, paddingBottom: 48 },
  titulo: { fontSize: 30, fontWeight: 'bold', color: COLORES.texto },
  subtitulo: { color: COLORES.textoSuave, marginTop: 12, fontSize: 15 },
  opciones: { gap: 10, marginTop: 16 },
  enlaceCentro: { textAlign: 'center', color: COLORES.texto, fontWeight: 'bold', marginTop: 18, fontSize: 15 },
});
