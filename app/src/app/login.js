// =====================================================================
// PANTALLA · Iniciar sesión          Ruta: /login
// Historias: HU-02, HU-14, HU-20, HU-21
// Quién la ve: solo visitantes sin sesión (Perfil → "Iniciar sesión", o al
// tocar algo que pide sesión, como el "+" del menú).
//
// Un mismo login para clientes y administradores. El cliente entra en
// PASOS; la pantalla guarda en qué paso va en el estado "paso" y según ese
// valor dibuja una parte u otra:
//   'CREDENCIALES' → correo y contraseña                     (HU-02)
//   'METODO'       → elegir correo o Google Authenticator     (HU-21)
//                    (solo si vinculó Authenticator; si no, se salta)
//   'CODIGO'       → escribir el código de 6 dígitos          (HU-21)
//   'VENCIDA'      → la contraseña venció: crear una nueva    (HU-20)
// El administrador entra en el primer paso (HU-14 no cambia).
//
// Entre un paso y otro la API entrega un "pase" (token temporal de 10
// minutos que solo sirve para el paso siguiente). Se guarda en el estado
// de esta pantalla, en memoria, y se manda como token.
//
// Al terminar no hace falta navegar a mano: iniciarSesion() cambia la
// sesión y _layout.js lleva al cliente a Inicio y al administrador a /admin.
// Administrador de la base: admin@alforno.cr / Cambiar.AlForno2026
// =====================================================================
import { useState } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { useSesion } from '../context/SesionContext';
import {
  login, enviarCodigo, verificarCodigo, cambiarContrasenaVencida, reenviarVerificacion,
} from '../services/auth';
import CampoFormulario from '../components/CampoFormulario';
import ListaPolitica from '../components/ListaPolitica';
import Aviso from '../components/Aviso';
import Opcion from '../components/Opcion';
import Boton from '../components/Boton';
import { cumplePolitica } from '../utils/contrasena';
import { COLORES } from '../config/config';

export default function Login() {
  // Del contexto de sesión: guarda al usuario y con eso cambia la navegación.
  const { iniciarSesion } = useSesion();

  // Estado de la pantalla (useState): [valor, función para cambiarlo].
  const [paso, setPaso] = useState('CREDENCIALES');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [pase, setPase] = useState(null);          // token temporal entre pasos
  const [metodos, setMetodos] = useState([]);      // ['CORREO'] o ['CORREO', 'AUTENTICADOR']
  const [metodo, setMetodo] = useState(null);      // el que eligió
  const [codigo, setCodigo] = useState('');
  const [nueva, setNueva] = useState('');          // paso VENCIDA
  const [confirmacion, setConfirmacion] = useState('');
  const [error, setError] = useState(null);        // recuadro de error
  const [info, setInfo] = useState(null);          // recuadro de información
  const [pendiente, setPendiente] = useState(false); // falta verificar el correo (HU-01)
  const [enviando, setEnviando] = useState(false); // true mientras espera a la API

  // Cuando la API responde LISTO, se guarda la sesión y termina el login.
  // Si responde CAMBIAR_CONTRASENA (HU-20), pasa al paso VENCIDA.
  function alResponderApi(respuesta) {
    if (respuesta.paso === 'LISTO') {
      iniciarSesion(respuesta.usuario, respuesta.token);
    } else if (respuesta.paso === 'CAMBIAR_CONTRASENA') {
      setPase(respuesta.pase);
      setInfo('Tu contraseña venció (tiene más de 90 días). Creá una nueva para entrar.');
      setPaso('VENCIDA');
    }
  }

  // Ejecuta una llamada a la API con el manejo común de todos los pasos:
  // evita enviar dos veces, limpia los avisos y muestra el error si falla.
  async function llamar(accion) {
    if (enviando) return;
    setError(null);
    setEnviando(true);
    try {
      await accion();
    } catch (e) {
      setError(e.message);
      // 423 = la cuenta se bloqueó (3 intentos, HU-02): el pase ya no sirve,
      // así que vuelve al primer paso con el mensaje de la API.
      if (e.status === 423 && paso !== 'CREDENCIALES') volverAlInicio(e.message);
    } finally {
      setEnviando(false);
    }
  }

  // Paso 1 · Correo y contraseña (HU-02).
  function alIniciarSesion() {
    setPendiente(false);
    setInfo(null);
    llamar(async () => {
      try {
        const respuesta = await login(correo, contrasena);
        if (respuesta.paso === 'LISTO') return alResponderApi(respuesta); // administrador
        setPase(respuesta.pase);
        setMetodos(respuesta.metodos);
        // Si solo tiene correo, se salta la elección y se envía el código.
        if (respuesta.metodos.length === 1) await elegirMetodo('CORREO', respuesta.pase);
        else setPaso('METODO');
      } catch (e) {
        // 403 con pendiente: la cuenta existe pero no ha confirmado el correo.
        if (e.datos?.pendiente) setPendiente(true);
        throw e; // llamar() muestra el mensaje
      }
    });
  }

  // Paso 2 · Elegir cómo recibir el código (HU-21).
  // paseActual: en el paso 1 el estado "pase" todavía no se actualizó,
  // por eso se recibe aparte.
  async function elegirMetodo(elegido, paseActual = pase) {
    setMetodo(elegido);
    setCodigo('');
    if (elegido === 'CORREO') {
      const { mensaje } = await enviarCodigo(paseActual);
      setInfo(`${mensaje}. Vence en 2 minutos.`);
    } else {
      setInfo('Escribí el código que muestra Google Authenticator.');
    }
    setPaso('CODIGO');
  }

  // Paso 3 · Verificar el código (HU-21).
  function alVerificarCodigo() {
    llamar(async () => {
      alResponderApi(await verificarCodigo(pase, metodo, codigo));
    });
  }

  // Paso 4 · Contraseña vencida (HU-20).
  function alCambiarVencida() {
    if (nueva !== confirmacion) return setError('Las contraseñas no coinciden');
    llamar(async () => {
      alResponderApi(await cambiarContrasenaVencida(pase, nueva, confirmacion));
    });
  }

  // HU-01 · Reenviar el correo de verificación.
  function alReenviarVerificacion() {
    llamar(async () => {
      const { mensaje } = await reenviarVerificacion(correo);
      setPendiente(false);
      setInfo(mensaje);
    });
  }

  // "Volver": regresa al paso 1 y borra lo de los otros pasos.
  function volverAlInicio(mensaje = null) {
    setPaso('CREDENCIALES');
    setPase(null);
    setCodigo('');
    setNueva('');
    setConfirmacion('');
    setInfo(null);
    setError(mensaje);
  }

  return (
    <ScrollView
      style={{ backgroundColor: COLORES.crema }}
      contentContainerStyle={estilos.contenedor}
      keyboardShouldPersistTaps="handled"
    >
      {/* ---------- Paso 1 · Correo y contraseña ---------- */}
      {paso === 'CREDENCIALES' && (
        <>
          <Text style={estilos.titulo}>Bienvenido de nuevo</Text>
          <Text style={estilos.subtitulo}>Ingresá con tu correo y contraseña.</Text>

          {/* Mensajes de la API: "Correo o contraseña incorrectos" (sin decir
              cuál falló), "Cuenta bloqueada. Intenta de nuevo en X segundos"... */}
          {error ? <Aviso texto={error} /> : null}
          {info ? <Aviso tipo="info" texto={info} /> : null}
          {pendiente ? (
            <Pressable onPress={alReenviarVerificacion}>
              <Text style={estilos.enlaceCentro}>Reenviar correo de verificación</Text>
            </Pressable>
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

          <Boton
            texto={enviando ? 'Ingresando…' : 'Iniciar sesión'}
            onPress={alIniciarSesion}
            deshabilitado={enviando}
          />

          {/* HU-22 · Link navega a /recuperar (src/app/recuperar.js) */}
          <Link href="/recuperar" style={estilos.enlaceCentro}>
            ¿Olvidaste tu contraseña?
          </Link>
          <Text style={estilos.pie}>
            ¿No tenés cuenta?{' '}
            <Link href="/registro" style={estilos.enlace}>
              Registrate
            </Link>
          </Text>
        </>
      )}

      {/* ---------- Paso 2 · Elegir método (HU-21) ---------- */}
      {paso === 'METODO' && (
        <>
          <Text style={estilos.titulo}>Verificá que sos vos</Text>
          <Text style={estilos.subtitulo}>¿Cómo querés recibir el código?</Text>
          {error ? <Aviso texto={error} /> : null}
          <View style={estilos.opciones}>
            {metodos.map((m) => (
              <Opcion
                key={m}
                texto={m === 'CORREO' ? 'Código por correo' : 'Google Authenticator'}
                subtexto={m === 'CORREO' ? 'Te lo enviamos ahora' : 'El código de la app'}
                onPress={() => llamar(() => elegirMetodo(m))}
                deshabilitada={enviando}
              />
            ))}
          </View>
          <Volver onPress={() => volverAlInicio()} />
        </>
      )}

      {/* ---------- Paso 3 · Código de 6 dígitos (HU-21) ---------- */}
      {paso === 'CODIGO' && (
        <>
          <Text style={estilos.titulo}>Código de verificación</Text>
          {info ? <Aviso tipo="info" texto={info} /> : null}
          {error ? <Aviso texto={error} /> : null}
          <CampoFormulario
            etiqueta="CÓDIGO"
            value={codigo}
            onChangeText={setCodigo}
            placeholder="6 dígitos"
            keyboardType="number-pad"
            maxLength={6}
            onSubmitEditing={alVerificarCodigo}
          />
          <Boton
            texto={enviando ? 'Verificando…' : 'Verificar'}
            onPress={alVerificarCodigo}
            deshabilitado={enviando || codigo.length !== 6}
          />
          {metodo === 'CORREO' ? (
            <Pressable onPress={() => llamar(() => elegirMetodo('CORREO'))}>
              <Text style={estilos.enlaceCentro}>Reenviar código</Text>
            </Pressable>
          ) : null}
          <Volver onPress={() => volverAlInicio()} />
        </>
      )}

      {/* ---------- Paso 4 · Contraseña vencida (HU-20) ---------- */}
      {paso === 'VENCIDA' && (
        <>
          <Text style={estilos.titulo}>Nueva contraseña</Text>
          {info ? <Aviso tipo="info" texto={info} /> : null}
          {error ? <Aviso texto={error} /> : null}
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
          {/* HU-20: solo se habilita cuando cumple todas las reglas */}
          <Boton
            texto={enviando ? 'Guardando…' : 'Guardar y entrar'}
            onPress={alCambiarVencida}
            deshabilitado={enviando || !cumplePolitica(nueva)}
          />
          <Volver onPress={() => volverAlInicio()} />
        </>
      )}
    </ScrollView>
  );
}


// Enlace "Volver" de los pasos 2, 3 y 4.
function Volver({ onPress }) {
  return (
    <Pressable onPress={onPress}>
      <Text style={estilos.enlaceCentro}>Volver</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  contenedor: { padding: 24, paddingTop: 32 },
  titulo: { fontSize: 30, fontWeight: 'bold', color: COLORES.texto },
  subtitulo: { color: COLORES.textoSuave, marginTop: 6, marginBottom: 12, fontSize: 15 },
  opciones: { gap: 10, marginTop: 12 },
  enlaceCentro: { textAlign: 'center', color: COLORES.texto, fontWeight: 'bold', marginTop: 18, fontSize: 15 },
  pie: { textAlign: 'center', color: COLORES.textoSuave, marginTop: 18, fontSize: 15 },
  enlace: { color: COLORES.texto, fontWeight: 'bold' },
});
