// =====================================================================
// PANTALLA · Google Authenticator    Ruta: /autenticador   ·   HU-21
// Quién la ve: solo clientes con sesión iniciada
// Se llega desde: Perfil → "Google Authenticator"
//
// Vincular es OPCIONAL. Si el cliente lo vincula, al iniciar sesión puede
// elegir entre el código por correo o el de Google Authenticator.
// Tiene dos vistas según "activo" (dato de GET /api/perfil):
//   · No vinculado: 1) "Generar clave" → la API crea una clave secreta.
//                   2) El cliente la copia (botón "Copiar") y la pega en
//                      Google Authenticator → "Ingresar una clave de
//                      configuración" (se vincula SIN código QR).
//                   3) Escribe el primer código que muestra la app y la
//                      API lo comprueba: con eso queda vinculado.
//   · Vinculado:    puede desvincularlo escribiendo un código actual.
// La clave secreta se guarda cifrada en la base (HU-23).
// Datos: services/perfil.js, con el token.
// =====================================================================
import { useEffect, useState } from 'react';
import { ScrollView, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useSesion } from '../context/SesionContext';
import {
  obtenerPerfil, iniciarVinculacion, confirmarVinculacion, desvincularAutenticador,
} from '../services/perfil';
import CampoFormulario from '../components/CampoFormulario';
import Aviso from '../components/Aviso';
import Boton from '../components/Boton';
import { COLORES } from '../config/config';

export default function Autenticador() {
  const { token } = useSesion();
  const [activo, setActivo] = useState(null);    // null = cargando
  const [clave, setClave] = useState(null);      // { clave, clave_formateada, cuenta, emisor }
  const [codigo, setCodigo] = useState('');
  const [copiada, setCopiada] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);
  const [enviando, setEnviando] = useState(false);

  // Al abrir, se pregunta a la API si ya está vinculado.
  useEffect(() => {
    obtenerPerfil(token)
      .then((perfil) => setActivo(perfil.authenticator_activo))
      .catch((e) => setError(e.message));
  }, [token]);

  // Manejo común: evita enviar dos veces y muestra el error de la API.
  async function llamar(accion) {
    if (enviando) return;
    setError(null);
    setExito(null);
    setEnviando(true);
    try {
      await accion();
    } catch (e) {
      setError(e.message); // ej. "El código no es correcto"
    } finally {
      setEnviando(false);
    }
  }

  // Paso 1 · Pedir la clave a la API.
  const alGenerarClave = () => llamar(async () => {
    setClave(await iniciarVinculacion(token));
    setCopiada(false);
    setCodigo('');
  });

  // Paso 2 · Copiar la clave al portapapeles del celular (expo-clipboard).
  async function alCopiar() {
    await Clipboard.setStringAsync(clave.clave);
    setCopiada(true);
  }

  // Paso 3 · Confirmar con el primer código.
  const alConfirmar = () => llamar(async () => {
    const { mensaje } = await confirmarVinculacion(token, codigo);
    setExito(mensaje);
    setActivo(true);
    setClave(null);
    setCodigo('');
  });

  // Desvincular (pide un código actual de la app).
  const alDesvincular = () => llamar(async () => {
    const { mensaje } = await desvincularAutenticador(token, codigo);
    setExito(mensaje);
    setActivo(false);
    setCodigo('');
  });

  if (activo === null && !error) {
    return <ActivityIndicator style={{ marginTop: 40 }} color={COLORES.terracota} />;
  }

  // Campo del código: lo usan "Confirmar" y "Desvincular".
  const campoCodigo = (
    <CampoFormulario
      etiqueta="CÓDIGO DE GOOGLE AUTHENTICATOR"
      value={codigo}
      onChangeText={setCodigo}
      placeholder="6 dígitos"
      keyboardType="number-pad"
      maxLength={6}
    />
  );

  return (
    <ScrollView style={estilos.fondo} contentContainerStyle={estilos.contenedor} keyboardShouldPersistTaps="handled">
      {exito ? <Aviso tipo="exito" texto={exito} /> : null}
      {error ? <Aviso texto={error} /> : null}

      {/* ---------- Vinculado ---------- */}
      {activo === true && (
        <>
          <Text style={estilos.titulo}>Google Authenticator está vinculado</Text>
          <Text style={estilos.texto}>
            Al iniciar sesión podés usar el código de la app o el que te enviamos por correo.
            Para desvincularlo, escribí el código que muestra la app ahora.
          </Text>
          {campoCodigo}
          <View style={{ marginTop: 18 }}>
            <Boton texto="Desvincular" variante="secundario" onPress={alDesvincular} deshabilitado={enviando || codigo.length !== 6} />
          </View>
        </>
      )}

      {/* ---------- No vinculado, todavía sin clave ---------- */}
      {activo === false && !clave && (
        <>
          <Text style={estilos.titulo}>Vincular Google Authenticator</Text>
          <Text style={estilos.texto}>
            Es opcional. Te sirve para iniciar sesión y para recuperar tu contraseña con un código de la app.
          </Text>
          <View style={{ marginTop: 18 }}>
            <Boton texto="Generar clave" onPress={alGenerarClave} deshabilitado={enviando} />
          </View>
        </>
      )}

      {/* ---------- No vinculado, con la clave generada ---------- */}
      {activo === false && clave && (
        <>
          <Text style={estilos.titulo}>Vincular Google Authenticator</Text>
          <Text style={estilos.texto}>1. Copiá esta clave:</Text>
          <View style={estilos.clave}>
            {/* selectable: también se puede copiar dejándola presionada */}
            <Text selectable style={estilos.claveTexto}>{clave.clave_formateada}</Text>
          </View>
          <Boton texto={copiada ? 'Clave copiada ✓' : 'Copiar'} variante="secundario" onPress={alCopiar} />
          <Text style={estilos.texto}>
            2. En Google Authenticator tocá "+" → "Ingresar una clave de configuración". En nombre
            escribí {clave.emisor} ({clave.cuenta}), pegá la clave y elegí "Basada en el tiempo".
          </Text>
          <Text style={estilos.texto}>3. Escribí el código de 6 dígitos que aparece:</Text>
          {campoCodigo}
          <View style={{ marginTop: 18 }}>
            <Boton texto={enviando ? 'Confirmando…' : 'Confirmar'} onPress={alConfirmar} deshabilitado={enviando || codigo.length !== 6} />
          </View>
        </>
      )}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  fondo: { backgroundColor: COLORES.crema },
  contenedor: { padding: 24, paddingBottom: 48 },
  titulo: { fontSize: 22, fontWeight: 'bold', color: COLORES.texto, marginTop: 8 },
  texto: { color: COLORES.textoSuave, marginTop: 14, fontSize: 15, lineHeight: 21 },
  clave: { backgroundColor: COLORES.cremaClara, borderRadius: 8, padding: 16, marginTop: 10 },
  claveTexto: { fontSize: 18, fontWeight: 'bold', letterSpacing: 2, textAlign: 'center', color: COLORES.texto },
});
