// =====================================================================
// PANTALLA · Nueva reserva
// Ruta: /nueva-reserva   ·   Historia: HU-10
// Quién la ve: solo clientes con sesión iniciada
// Se llega desde: pestaña Reservas → "Nueva reserva"
// Lleva a: vuelve a la pestaña Reservas ("Ver mis reservas")
//
// Pasos: 1. día (hoy y los próximos 30)  2. hora (GET /api/reservas/horas;
// las que tienen 3 reservas dicen "Sin espacio")  3. personas (1 a 8). "Confirmar reserva" → POST /api/reservas.
// Al confirmarse muestra el resumen (HU-10).
// La base revisa al guardar que la hora siga libre (candado GET_LOCK) y que
// el cliente no tenga otra reserva ese día; si no, avisa con el mensaje.
// =====================================================================
import { useEffect, useState } from 'react';
import { ScrollView, View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSesion } from '../context/SesionContext';
import { listarHoras, crearReserva } from '../services/reservas';
import Opcion from '../components/Opcion';
import Boton from '../components/Boton';
import { COLORES } from '../config/config';

const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

// Los 31 días que se pueden escoger: hoy y los 30 siguientes.
// Cada uno: { fecha: '2026-10-17', titulo: 'Sáb', detalle: '17 oct' }
function proximosDias() {
  const dias = [];
  for (let i = 0; i <= 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const fecha = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const titulo = i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : DIAS_CORTOS[d.getDay()];
    dias.push({ fecha, titulo, detalle: `${d.getDate()} ${MESES_CORTOS[d.getMonth()]}` });
  }
  return dias;
}
const DIAS = proximosDias();

export default function NuevaReserva() {
  const router = useRouter();
  const { token } = useSesion();

  const [fecha, setFecha] = useState(null);
  const [horas, setHoras] = useState([]);
  const [cargandoHoras, setCargandoHoras] = useState(false);
  const [hora, setHora] = useState(null);
  const [personas, setPersonas] = useState(2);
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [confirmada, setConfirmada] = useState(null); // la reserva creada → resumen

  // Pide las horas del día escogido.
  function cargarHoras(dia) {
    setCargandoHoras(true);
    listarHoras(token, dia)
      .then(setHoras)
      .catch((e) => setError(e.message))
      .finally(() => setCargandoHoras(false));
  }

  // Cada vez que cambia el día: se borra la hora escogida y se piden las horas.
  useEffect(() => {
    if (!fecha) return;
    setHora(null);
    setError(null);
    cargarHoras(fecha);
  }, [fecha]); // eslint-disable-line react-hooks/exhaustive-deps

  async function alConfirmar() {
    if (enviando) return;
    if (!fecha || !hora) {
      setError('Escoge un día y una hora');
      return;
    }
    setError(null);
    setEnviando(true);
    try {
      const reserva = await crearReserva(token, { fecha, hora, personas });
      setConfirmada(reserva);
    } catch (e) {
      // Ej.: "Sin espacio…" (otro cliente tomó el último espacio) o
      // "Ya tiene una reserva para ese día". Se recargan las horas.
      setError(e.message);
      cargarHoras(fecha);
      setEnviando(false);
    }
  }

  // Resumen de la reserva confirmada (HU-10).
  if (confirmada) {
    return (
      <ScrollView style={estilos.fondo} contentContainerStyle={estilos.contenedor}>
        <View style={estilos.exito}>
          <Ionicons name="checkmark-circle" size={48} color="#FFFFFF" />
          <Text style={estilos.exitoTitulo}>¡Reserva confirmada!</Text>
        </View>
        <View style={estilos.tarjeta}>
          <Fila icono="calendar-outline" texto={confirmada.fechaTexto} />
          <Fila icono="time-outline" texto={confirmada.horaTexto} />
          <Fila icono="people-outline" texto={`${confirmada.personas} ${confirmada.personas === 1 ? 'persona' : 'personas'}`} />
        </View>
        <Boton texto="Ver mis reservas" onPress={() => router.back()} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={estilos.fondo} contentContainerStyle={estilos.contenedor} keyboardShouldPersistTaps="handled">
      {/* 1. Día: fila que se desliza hacia los lados */}
      <Text style={estilos.paso}>1. DÍA</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.filaOpciones}>
        {DIAS.map((d) => (
          <Opcion key={d.fecha} texto={d.titulo} subtexto={d.detalle} seleccionada={fecha === d.fecha} onPress={() => setFecha(d.fecha)} />
        ))}
      </ScrollView>

      {/* 2. Hora */}
      <Text style={estilos.paso}>2. HORA</Text>
      {!fecha ? (
        <Text style={estilos.suave}>Primero escoge un día.</Text>
      ) : cargandoHoras ? (
        <ActivityIndicator color={COLORES.terracota} />
      ) : (
        <View style={estilos.rejilla}>
          {horas.map((h) => (
            <Opcion
              key={h.hora}
              texto={h.horaTexto}
              // "Sin espacio" si ya tiene 3; "1 lugar" si queda uno
              subtexto={h.libres === 0 ? 'Sin espacio' : h.disponible ? `${h.libres} ${h.libres === 1 ? 'lugar' : 'lugares'}` : 'Ya pasó'}
              seleccionada={hora === h.hora}
              deshabilitada={!h.disponible}
              onPress={() => setHora(h.hora)}
            />
          ))}
        </View>
      )}

      {/* 3. Personas: − número + */}
      <Text style={estilos.paso}>3. PERSONAS</Text>
      <View style={estilos.contador}>
        <BotonRedondo icono="remove" deshabilitado={personas <= 1} onPress={() => setPersonas(personas - 1)} />
        <Text style={estilos.numero}>{personas}</Text>
        <BotonRedondo icono="add" deshabilitado={personas >= 8} onPress={() => setPersonas(personas + 1)} />
      </View>
      <Text style={estilos.suave}>Para grupos de más de 8 personas, llamá al restaurante.</Text>

      {error ? (
        <View style={estilos.error}>
          <Ionicons name="alert-circle-outline" size={20} color={COLORES.terracotaOscuro} />
          <Text style={estilos.errorTexto}>{error}</Text>
        </View>
      ) : null}

      <Pressable
        onPress={alConfirmar}
        disabled={enviando}
        style={({ pressed }) => [estilos.boton, (pressed || enviando) && { opacity: 0.7 }]}
      >
        <Text style={estilos.botonTexto}>{enviando ? 'RESERVANDO…' : 'CONFIRMAR RESERVA'}</Text>
      </Pressable>
    </ScrollView>
  );
}

// Fila del resumen: ícono + texto.
function Fila({ icono, texto }) {
  return (
    <View style={estilos.filaResumen}>
      <Ionicons name={icono} size={20} color={COLORES.terracota} />
      <Text style={estilos.textoResumen}>{texto}</Text>
    </View>
  );
}

// Botón redondo − / + para la cantidad de personas.
function BotonRedondo({ icono, onPress, deshabilitado }) {
  return (
    <Pressable onPress={onPress} disabled={deshabilitado} style={[estilos.redondo, deshabilitado && { opacity: 0.3 }]}>
      <Ionicons name={icono} size={22} color={COLORES.texto} />
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  fondo: { backgroundColor: COLORES.crema },
  contenedor: { padding: 16, paddingBottom: 40 },
  paso: { color: COLORES.terracota, fontWeight: 'bold', letterSpacing: 2, marginTop: 20, marginBottom: 10 },
  filaOpciones: { gap: 8, paddingRight: 8 },
  rejilla: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  suave: { color: COLORES.textoSuave, marginTop: 6 },
  contador: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  redondo: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: '#CFC4B8', backgroundColor: COLORES.cremaClara, alignItems: 'center', justifyContent: 'center' },
  numero: { fontSize: 26, fontWeight: 'bold', color: COLORES.texto, minWidth: 30, textAlign: 'center' },
  error: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F3DCD2', borderRadius: 10, padding: 14, marginTop: 20 },
  errorTexto: { flex: 1, color: COLORES.terracotaOscuro, fontWeight: 'bold' },
  boton: { backgroundColor: COLORES.terracota, borderRadius: 8, paddingVertical: 16, marginTop: 24 },
  botonTexto: { color: '#FFFFFF', fontWeight: 'bold', letterSpacing: 1.5, textAlign: 'center', fontSize: 15 },
  exito: { backgroundColor: COLORES.terracota, borderRadius: 8, padding: 24, alignItems: 'center', marginBottom: 16 },
  exitoTitulo: { color: '#FFFFFF', fontSize: 22, fontWeight: 'bold', marginTop: 8 },
  tarjeta: { backgroundColor: COLORES.cremaClara, borderRadius: 8, padding: 16 },
  filaResumen: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  textoResumen: { fontSize: 16, color: COLORES.texto, flexShrink: 1 },
});
