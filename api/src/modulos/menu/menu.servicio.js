// CAPA LÓGICA DE NEGOCIO (servicio) del módulo Menú (HU-03).
// Decide qué datos salen hacia la app y en qué forma.
const menuRepositorio = require('./menu.repositorio');

// HU-03 · Menú agrupado por categoría.
// La base devuelve una lista plana de productos; aquí se agrupan para que
// la app solo tenga que dibujarlos:
//   [ { categoria: 'Pizzas', productos: [ {id, nombre, descripcion, precio}, ... ] },
//     { categoria: 'Cucina italiana', productos: [...] }, ... ]
// Una categoría sin productos activos no aparece.
async function obtenerMenu() {
  const productos = await menuRepositorio.listarMenu();

  const categorias = [];
  for (const p of productos) {
    // Como vienen ordenados por categoría, si la última categoría de la lista
    // no es la de este producto, se empieza una categoría nueva.
    let ultima = categorias[categorias.length - 1];
    if (!ultima || ultima.categoria !== p.categoria) {
      ultima = { categoria: p.categoria, productos: [] };
      categorias.push(ultima);
    }
    // Solo los datos que muestra la pantalla. (La columna "agotado" existe
    // en la base, pero en esta versión no se usa.)
    ultima.productos.push({
      id: p.id,
      nombre: p.nombre,
      descripcion: p.descripcion,
      precio: p.precio,
    });
  }
  return categorias;
}

module.exports = { obtenerMenu };
