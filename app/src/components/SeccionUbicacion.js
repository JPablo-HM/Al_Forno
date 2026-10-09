// =====================================================================
// SECCIÓN · Ubicación y contacto (dentro de la pantalla Inicio)
// Historia: HU-05
// Datos: GET /api/restaurante (services/informacion.js)
//
// Muestra el nombre, la dirección escrita, las señas y un único teléfono
// (solo como información, sin botones). Según HU-05 no hay mapa ni botón
// para abrir Waze o Google Maps.
// =====================================================================
import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { obtenerRestaurante } from '../services/informacion';
import { COLORES } from '../config/config';

// '22223333' → '2222-3333' (formato de teléfono de Costa Rica)
function formatearTelefono(numero) {
  return `${numero.slice(0, 4)}-${numero.slice(4)}`;
}

export default function SeccionUbicacion() {
  // Estados de la sección: los datos, si está cargando y si hubo error.
  const [restaurante, setRestaurante] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // useEffect con [] se ejecuta una sola vez, cuando la sección aparece.
  // Pide los datos a la API y guarda el resultado (o el error).
  useEffect(() => {
    obtenerRestaurante()
      .then(setRestaurante)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, []);

  // Lo que se dibuja depende del estado: cargando → error → datos.
  let contenido;
  if (cargando) {
    contenido = <ActivityIndicator color={COLORES.terracota} />;
  } else if (error) {
    contenido = <Text style={estilos.error}>No se pudo cargar la ubicación. {error}</Text>;
  } else {
    contenido = (
      <>
        <View style={estilos.fila}>
          <Ionicons name="location-outline" size={24} color={COLORES.terracota} />
          <View style={estilos.textos}>
            <Text style={estilos.nombre}>{restaurante.nombre}</Text>
            <Text style={estilos.direccion}>{restaurante.direccion}</Text>
            {/* Las señas son opcionales en la base: si no hay, no se dibuja nada */}
            {restaurante.senas ? <Text style={estilos.senas}>{restaurante.senas}</Text> : null}
          </View>
        </View>

        <View style={[estilos.fila, estilos.telefono]}>
          <Ionicons name="call-outline" size={22} color={COLORES.terracota} />
          <Text style={[estilos.textos, estilos.numero]}>{formatearTelefono(restaurante.telefono)}</Text>
        </View>
      </>
    );
  }

  return (
    <View style={estilos.tarjeta}>
      <Text style={estilos.titulo}>UBICACIÓN</Text>
      {contenido}
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: { backgroundColor: COLORES.cremaClara, borderRadius: 8, padding: 16, marginBottom: 16 },
  titulo: { color: COLORES.terracota, fontWeight: 'bold', letterSpacing: 2, marginBottom: 12 },
  fila: { flexDirection: 'row', alignItems: 'flex-start' },
  textos: { flex: 1, marginLeft: 12 },
  nombre: { fontSize: 20, fontWeight: 'bold', color: COLORES.texto },
  direccion: { color: COLORES.textoSuave, marginTop: 2 },
  senas: { color: COLORES.texto, marginTop: 8, lineHeight: 20 },
  telefono: { alignItems: 'center', marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORES.crema },
  numero: { fontSize: 16, color: COLORES.texto },
  error: { color: COLORES.terracotaOscuro },
});
