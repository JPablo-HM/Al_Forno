// Funciones para mostrar datos con el formato de Costa Rica.
// Van aparte porque las usan varias pantallas (Menú, Carrito...).

// 6500 → '₡6.500'   ·   12500 → '₡12.500'
// La expresión regular pone un punto cada 3 dígitos, contando desde la derecha.
export function formatearColones(monto) {
  return '₡' + String(monto).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
