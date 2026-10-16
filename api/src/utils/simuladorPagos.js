// =====================================================================
// SIMULADOR DE PAGOS (HU-08)
//
// No se conecta con ningún banco ni pasarela: no se cobra dinero real.
// Decide si una tarjeta "se aprueba" con reglas fijas de prueba:
//   · Tarjeta vencida → rechazada
//   · Número que termina en 0000 → rechazada siempre (tarjeta de prueba)
//   · Cualquier otra tarjeta válida → aprobada
//
// El formato (16 dígitos, CVV de 3, vencimiento MM/AA) ya lo revisó la ruta
// con express-validator. La tarjeta NUNCA se guarda: solo los últimos 4
// dígitos, que se muestran en el comprobante.
// =====================================================================
const { ahora } = require('./tiempo');

// Devuelve { aprobado: true, ultimos4 } o { aprobado: false, motivo }.
function procesarPago({ numero, vencimiento }) {
  // '08/27' → mes 8, año 2027. La tarjeta sirve hasta el último día de ese mes.
  const [mes, anio] = vencimiento.split('/').map(Number);
  const hoy = ahora();
  const anioActual = hoy.year() % 100; // 2026 → 26
  const mesActual = hoy.month() + 1;   // dayjs cuenta los meses desde 0
  if (anio < anioActual || (anio === anioActual && mes < mesActual)) {
    return { aprobado: false, motivo: 'Pago rechazado: la tarjeta está vencida' };
  }

  if (numero.endsWith('0000')) {
    return { aprobado: false, motivo: 'Pago rechazado por el banco. Intenta con otra tarjeta' };
  }

  return { aprobado: true, ultimos4: numero.slice(-4) };
}

module.exports = { procesarPago };
