// =====================================================================
// COMPONENTE · Total en dólares (HU-27)
// Datos: GET /api/tipo-cambio (services/tipoCambio.js)
// Se usa en: Carrito y Resumen del pedido, debajo del total.
//
// Muestra una línea: "≈ $30,26 · Tipo de cambio BCCR (venta): ₡520,45"
// Usa el tipo de cambio de VENTA del Banco Central de Costa Rica (el mismo
// con el que se cobra en PayPal). La API es la que consulta al BCCR.
// Si no se puede obtener, no muestra nada: el resto de la pantalla sigue igual.
// =====================================================================
import { useEffect, useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { obtenerTipoCambio } from '../services/tipoCambio';
import { formatearDolares, formatearDecimal } from '../utils/formato';
import { COLORES } from '../config/config';

export default function TotalEnDolares({ total }) {
  const [tipoCambio, setTipoCambio] = useState(null);

  // Se pide una sola vez, cuando aparece. Si falla, se queda en null.
  useEffect(() => {
    obtenerTipoCambio().then(setTipoCambio).catch(() => {});
  }, []);

  if (!tipoCambio) return null;

  return (
    <Text style={estilos.dolares}>
      ≈ {formatearDolares(total, tipoCambio.venta)} · Tipo de cambio BCCR (venta): ₡{formatearDecimal(tipoCambio.venta)}
    </Text>
  );
}

const estilos = StyleSheet.create({
  dolares: { textAlign: 'right', color: COLORES.textoSuave, fontSize: 13, marginTop: 4, marginBottom: 12 },
});
