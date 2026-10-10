// =====================================================================
// Reglas del carrito (HU-07) como funciones "puras": reciben la lista de
// productos y devuelven una lista NUEVA, sin modificar la original.
// Están aparte de CarritoContext.js para poder probarlas solas.
//
// Cada producto del carrito tiene la forma: { id, nombre, precio, cantidad }
// =====================================================================

// HU-07: de 1 a 10 unidades por producto
export const CANTIDAD_MINIMA = 1;
export const CANTIDAD_MAXIMA = 10;

// Agrega un producto del menú. Si ya está en el carrito le suma 1
// (sin pasar de 10); si no está, lo agrega con cantidad 1.
export function agregarProducto(lista, producto) {
  const existente = lista.find((p) => p.id === producto.id);
  if (existente) {
    return cambiarCantidadProducto(lista, producto.id, existente.cantidad + 1);
  }
  // ...lista = copia de la lista actual, y al final el producto nuevo
  return [...lista, { id: producto.id, nombre: producto.nombre, precio: producto.precio, cantidad: 1 }];
}

// Cambia la cantidad de un producto. Math.min y Math.max la mantienen
// entre 1 y 10 aunque se pida otra cosa.
export function cambiarCantidadProducto(lista, id, cantidad) {
  const nueva = Math.max(CANTIDAD_MINIMA, Math.min(CANTIDAD_MAXIMA, cantidad));
  // map() recorre la lista; solo cambia el producto con ese id
  return lista.map((p) => (p.id === id ? { ...p, cantidad: nueva } : p));
}

// Quita un producto del carrito (botón 🗑). filter() deja todos menos ese.
export function quitarProducto(lista, id) {
  return lista.filter((p) => p.id !== id);
}

// Total = suma de (precio × cantidad) de cada producto.
// reduce() va acumulando la suma, empezando en 0.
export function calcularTotal(lista) {
  return lista.reduce((suma, p) => suma + p.precio * p.cantidad, 0);
}
