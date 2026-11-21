// Funciones para mostrar datos con el formato de Costa Rica.
// Van aparte porque las usan varias pantallas (Menú, Carrito...).

// 6500 → '₡6.500'   ·   12500 → '₡12.500'
// La expresión regular pone un punto cada 3 dígitos, contando desde la derecha.
export function formatearColones(monto) {
  return '₡' + String(monto).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Fecha de MySQL en hora de Costa Rica → texto para el cliente.
// '2026-10-15 20:30:05' → '15/10/2026 · 8:30 p.m.'
export function formatearFecha(fechaTexto) {
  const [dia, hora] = fechaTexto.split(' ');
  const [a, m, d] = dia.split('-');
  const [h, min] = hora.split(':').map(Number);
  const sufijo = h < 12 ? 'a.m.' : 'p.m.';
  const hora12 = h % 12 === 0 ? 12 : h % 12;
  return `${d}/${m}/${a} · ${hora12}:${String(min).padStart(2, '0')} ${sufijo}`;
}

// Número con 2 decimales en formato de Costa Rica (coma para decimales).
// 446.17 → '446,17'   ·   1234.5 → '1.234,50'
export function formatearDecimal(numero) {
  const [entero, decimales] = numero.toFixed(2).split('.');
  return entero.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + decimales;
}

// Monto en colones → su equivalente en dólares con el tipo de cambio de venta.
// formatearDolares(6500, 446.17) → '$14,57'
export function formatearDolares(colones, venta) {
  return '$' + formatearDecimal(colones / venta);
}
