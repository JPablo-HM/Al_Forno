// =====================================================================
// PANTALLA · Agenda (pestaña del cliente)
// Ruta: /agenda   ·   Historia: HU-12
// Quién la ve: visitantes y clientes (no necesita sesión)
// Se llega desde: pestaña "Agenda" del menú inferior
// Lleva a: ninguna (es solo informativa)
//
// Pide la agenda a la API (GET /api/agenda). Por ahora es SOLO
// INFORMATIVA: muestra qué actividad hay cada día; no se compran ni se
// pagan entradas. Cada actividad es una tarjeta con los días, el nombre
// y la descripción. Todas se ven iguales (no se resalta el día de hoy).
// =====================================================================
import { useEffect, useState } from 'react';
import { ScrollView, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { listarAgenda } from '../../services/agenda';
import { COLORES } from '../../config/config';

export default function Agenda() {
  // Estados de la pantalla: la lista, si está cargando y si hubo error.
  const [actividades, setActividades] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Se ejecuta una sola vez, cuando la pantalla aparece.
  useEffect(() => {
    listarAgenda()
      .then(setActividades)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, []);

  // Lo que se dibuja depende del estado: cargando → error → vacío → lista.
  let contenido;
  if (cargando) {
    contenido = <ActivityIndicator color={COLORES.terracota} />;
  } else if (error) {
    contenido = <Text style={estilos.error}>No se pudo cargar la agenda. {error}</Text>;
  } else if (actividades.length === 0) {
    // Estado vacío
    contenido = (
      <View style={estilos.vacio}>
        <Ionicons name="musical-notes-outline" size={32} color={COLORES.textoSuave} />
        <Text style={estilos.vacioTitulo}>No hay actividades por el momento</Text>
        <Text style={estilos.vacioTexto}>Volvé pronto para ver lo que se viene.</Text>
      </View>
    );
  } else {
    // Una tarjeta por actividad.
    contenido = actividades.map((a) => (
      <View key={a.id} style={estilos.actividad}>
        <View style={estilos.encabezado}>
          <Text style={estilos.dias}>{a.dias}</Text>
          <Ionicons name="musical-notes-outline" size={20} color={COLORES.terracota} />
        </View>
        <Text style={estilos.nombre}>{a.nombre}</Text>
        <Text style={estilos.descripcion}>{a.descripcion}</Text>
      </View>
    ));
  }

  return (
    <ScrollView style={estilos.fondo} contentContainerStyle={estilos.contenedor}>
      <View style={estilos.tarjeta}>
        <Text style={estilos.titulo}>AGENDA DE LA SEMANA</Text>
        {contenido}
      </View>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  fondo: { backgroundColor: COLORES.crema },
  contenedor: { padding: 16, paddingBottom: 32 },
  tarjeta: { backgroundColor: COLORES.cremaClara, borderRadius: 8, padding: 16 },
  titulo: { color: COLORES.terracota, fontWeight: 'bold', letterSpacing: 2, marginBottom: 12 },
  actividad: { borderLeftWidth: 4, borderLeftColor: COLORES.terracota, backgroundColor: COLORES.crema, borderRadius: 6, padding: 12, marginBottom: 10 },
  encabezado: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dias: { color: COLORES.terracota, fontWeight: 'bold', textTransform: 'uppercase', fontSize: 12, letterSpacing: 1 },
  nombre: { fontSize: 18, fontWeight: 'bold', color: COLORES.texto, marginTop: 4 },
  descripcion: { color: COLORES.textoSuave, marginTop: 4, lineHeight: 20 },
  vacio: { alignItems: 'center', paddingVertical: 8 },
  vacioTitulo: { fontSize: 17, fontWeight: 'bold', color: COLORES.texto, marginTop: 8, textAlign: 'center' },
  vacioTexto: { color: COLORES.textoSuave, textAlign: 'center', marginTop: 4 },
  error: { color: COLORES.terracotaOscuro },
});
