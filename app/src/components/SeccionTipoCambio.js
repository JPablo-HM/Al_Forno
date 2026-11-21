// =====================================================================
// SECCIÓN · Tipo de cambio (dentro de la pantalla Inicio)
// Datos: GET /api/tipo-cambio (services/tipoCambio.js)
//
// Muestra el tipo de cambio del dólar del Banco Central de Costa Rica
// (compra y venta). La API es la que consulta al BCCR; esta sección
// solo dibuja lo que recibe.
// =====================================================================
import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { obtenerTipoCambio } from '../services/tipoCambio';
import { formatearDecimal } from '../utils/formato';
import { COLORES } from '../config/config';

export default function SeccionTipoCambio() {
  // Estados de la sección: el tipo de cambio, si está cargando y si hubo error.
  const [tipoCambio, setTipoCambio] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Se ejecuta una sola vez, cuando la sección aparece.
  useEffect(() => {
    obtenerTipoCambio()
      .then(setTipoCambio)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, []);

  // Lo que se dibuja depende del estado: cargando → error → datos.
  let contenido;
  if (cargando) {
    contenido = <ActivityIndicator color={COLORES.terracota} />;
  } else if (error) {
    contenido = <Text style={estilos.error}>No se pudo cargar el tipo de cambio. {error}</Text>;
  } else {
    // '2026-11-21' → '21/11/2026'
    const [a, m, d] = tipoCambio.fecha.split('-');
    contenido = (
      <>
        <View style={estilos.fila}>
          <Text style={estilos.texto}>Compra</Text>
          <Text style={estilos.texto}>₡{formatearDecimal(tipoCambio.compra)}</Text>
        </View>
        <View style={estilos.fila}>
          <Text style={estilos.texto}>Venta</Text>
          <Text style={estilos.texto}>₡{formatearDecimal(tipoCambio.venta)}</Text>
        </View>
        <Text style={estilos.nota}>Banco Central de Costa Rica · {d}/{m}/{a}</Text>
      </>
    );
  }

  return (
    <View style={estilos.tarjeta}>
      <Text style={estilos.titulo}>TIPO DE CAMBIO DEL DÓLAR</Text>
      {contenido}
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: { backgroundColor: COLORES.cremaClara, borderRadius: 8, padding: 16, marginBottom: 16 },
  titulo: { color: COLORES.terracota, fontWeight: 'bold', letterSpacing: 2, marginBottom: 12 },
  fila: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: COLORES.crema },
  texto: { color: COLORES.texto },
  nota: { color: COLORES.textoSuave, fontSize: 12, marginTop: 8, paddingHorizontal: 8 },
  error: { color: COLORES.terracotaOscuro },
});
