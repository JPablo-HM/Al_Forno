// =====================================================================
// SECCIÓN · Promociones (dentro de la pantalla Inicio)
// Historia: HU-06
// Datos: GET /api/promociones (services/informacion.js)
//
// Muestra las promociones activas con título y descripción. Los días y
// las fechas vienen escritos en la descripción (ej. "Válido los martes
// hasta el 31 de octubre"). Son informativas: no aplican descuentos.
// Si no hay, muestra "No hay promociones por el momento" y un botón al Menú.
// =====================================================================
import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { listarPromociones } from '../services/informacion';
import Boton from './Boton';
import { COLORES } from '../config/config';

export default function SeccionPromociones() {
  // Estados de la sección: la lista, si está cargando y si hubo error.
  const [promociones, setPromociones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Se ejecuta una sola vez, cuando la sección aparece.
  useEffect(() => {
    listarPromociones()
      .then(setPromociones)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, []);

  // Lo que se dibuja depende del estado: cargando → error → vacío → lista.
  let contenido;
  if (cargando) {
    contenido = <ActivityIndicator color={COLORES.terracota} />;
  } else if (error) {
    contenido = <Text style={estilos.error}>No se pudieron cargar las promociones. {error}</Text>;
  } else if (promociones.length === 0) {
    // Estado vacío (criterio de HU-06)
    contenido = (
      <View style={estilos.vacio}>
        <Ionicons name="pricetag-outline" size={32} color={COLORES.textoSuave} />
        <Text style={estilos.vacioTitulo}>No hay promociones por el momento</Text>
        <Text style={estilos.vacioTexto}>Volvé pronto, siempre tenemos algo nuevo saliendo del horno.</Text>
        <Boton texto="Ver menú" href="/menu" variante="secundario" />
      </View>
    );
  } else {
    // Una tarjeta por promoción
    contenido = promociones.map((p) => (
      <View key={p.id} style={estilos.promo}>
        <View style={estilos.promoEncabezado}>
          <Text style={estilos.promoTitulo}>{p.titulo}</Text>
          <Ionicons name="pricetag-outline" size={20} color={COLORES.terracota} />
        </View>
        <Text style={estilos.promoDescripcion}>{p.descripcion}</Text>
      </View>
    ));
  }

  return (
    <View style={estilos.tarjeta}>
      <Text style={estilos.titulo}>PROMOCIONES</Text>
      {contenido}
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: { backgroundColor: COLORES.cremaClara, borderRadius: 8, padding: 16, marginBottom: 16 },
  titulo: { color: COLORES.terracota, fontWeight: 'bold', letterSpacing: 2, marginBottom: 12 },
  promo: { borderLeftWidth: 4, borderLeftColor: COLORES.terracota, backgroundColor: COLORES.crema, borderRadius: 6, padding: 12, marginBottom: 10 },
  promoEncabezado: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  promoTitulo: { flex: 1, fontSize: 18, fontWeight: 'bold', color: COLORES.texto, marginRight: 8 },
  promoDescripcion: { color: COLORES.textoSuave, marginTop: 4, lineHeight: 20 },
  vacio: { alignItems: 'center', paddingVertical: 8 },
  vacioTitulo: { fontSize: 17, fontWeight: 'bold', color: COLORES.texto, marginTop: 8, textAlign: 'center' },
  vacioTexto: { color: COLORES.textoSuave, textAlign: 'center', marginTop: 4 },
  error: { color: COLORES.terracotaOscuro },
});
