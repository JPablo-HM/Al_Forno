// =====================================================================
// SECCIÓN · Horario (dentro de la pantalla Inicio)
// Historia: HU-04
// Datos: GET /api/horario (services/informacion.js)
//
// Muestra el horario de los 7 días (información fija de la API).
// No resalta el día de hoy. No calcula si el local está abierto:
// la API ya envía las horas escritas y esta sección solo las dibuja.
// =====================================================================
import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { obtenerHorario } from '../services/informacion';
import { COLORES } from '../config/config';

export default function SeccionHorario() {
  // Estados de la sección: los 7 días, si está cargando y si hubo error.
  const [dias, setDias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Se ejecuta una sola vez, cuando la sección aparece.
  useEffect(() => {
    obtenerHorario()
      .then(setDias)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, []);

  // Lo que se dibuja depende del estado: cargando → error → datos.
  let contenido;
  if (cargando) {
    contenido = <ActivityIndicator color={COLORES.terracota} />;
  } else if (error) {
    contenido = <Text style={estilos.error}>No se pudo cargar el horario. {error}</Text>;
  } else {
    // Los 7 días. map() dibuja una fila por cada día; key identifica cada fila
    contenido = dias.map((d) => (
      <View key={d.id} style={estilos.fila}>
        <Text style={estilos.dia}>{d.dia}</Text>
        <Text style={[estilos.horas, d.horas === 'Cerrado' && estilos.cerrado]}>{d.horas}</Text>
      </View>
    ));
  }

  return (
    <View style={estilos.tarjeta}>
      <Text style={estilos.titulo}>HORARIO</Text>
      {contenido}
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: { backgroundColor: COLORES.cremaClara, borderRadius: 8, padding: 16, marginBottom: 16 },
  titulo: { color: COLORES.terracota, fontWeight: 'bold', letterSpacing: 2, marginBottom: 12 },
  fila: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: COLORES.crema },
  dia: { color: COLORES.texto },
  horas: { color: COLORES.texto },
  cerrado: { color: COLORES.textoSuave },
  error: { color: COLORES.terracotaOscuro },
});
