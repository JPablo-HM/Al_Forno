// =====================================================================
// SECCIÓN · Horario (dentro de la pantalla Inicio)
// Historia: HU-04
// Datos: GET /api/horario (services/informacion.js)
//
// Muestra el indicador "Abierto ahora" / "Cerrado" y el horario de los
// 7 días, resaltando el día de hoy. La API ya envía todo calculado
// (hora de Costa Rica): esta sección solo lo dibuja.
// =====================================================================
import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { obtenerHorario } from '../services/informacion';
import { COLORES } from '../config/config';

export default function SeccionHorario() {
  // Estados de la sección: los datos, si está cargando y si hubo error.
  const [horario, setHorario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Se ejecuta una sola vez, cuando la sección aparece.
  useEffect(() => {
    obtenerHorario()
      .then(setHorario)
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
    const { estado, dias } = horario;
    contenido = (
      <>
        {/* Indicador: el punto es verde si está abierto y gris si está cerrado */}
        <View style={estilos.estado}>
          <View style={[estilos.punto, { backgroundColor: estado.abierto ? '#2E7D32' : COLORES.textoSuave }]} />
          <View>
            <Text style={estilos.estadoTitulo}>{estado.abierto ? 'Abierto ahora' : 'Cerrado'}</Text>
            <Text style={estilos.estadoMensaje}>{estado.mensaje}</Text>
          </View>
        </View>

        {/* Los 7 días. map() dibuja una fila por cada día; key identifica cada fila */}
        {dias.map((d) => (
          <View key={d.id} style={[estilos.fila, d.esHoy && estilos.filaHoy]}>
            <Text style={[estilos.dia, d.esHoy && estilos.textoHoy]}>
              {d.esHoy ? `${d.dia} · hoy` : d.dia}
            </Text>
            <Text style={[estilos.horas, d.horas === 'Cerrado' && estilos.cerrado, d.esHoy && estilos.textoHoy]}>
              {d.horas}
            </Text>
          </View>
        ))}
      </>
    );
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
  estado: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORES.crema, borderRadius: 6, padding: 12, marginBottom: 12 },
  punto: { width: 14, height: 14, borderRadius: 7, marginRight: 12 },
  estadoTitulo: { fontSize: 18, fontWeight: 'bold', color: COLORES.texto },
  estadoMensaje: { color: COLORES.textoSuave, marginTop: 2 },
  fila: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: COLORES.crema },
  filaHoy: { backgroundColor: COLORES.negro, borderRadius: 6, borderBottomWidth: 0 },
  dia: { color: COLORES.texto },
  horas: { color: COLORES.texto },
  cerrado: { color: COLORES.textoSuave },
  textoHoy: { color: COLORES.crema, fontWeight: 'bold' },
  error: { color: COLORES.terracotaOscuro },
});
