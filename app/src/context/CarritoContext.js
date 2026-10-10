// Carrito del cliente (HU-07): los productos que va a pedir.
// Funciona igual que SesionContext: guarda el carrito en un solo lugar
// para que el Menú, el Carrito y el Resumen lean lo mismo. Así el carrito
// no se pierde al cambiar de pantalla.
//
// Vive solo en la app (no en la base de datos) hasta que se pague. Las
// reglas (máximo 10, total...) están en utils/carrito.js.
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useSesion } from './SesionContext';
import {
  agregarProducto,
  cambiarCantidadProducto,
  quitarProducto,
  calcularTotal,
} from '../utils/carrito';

const CarritoContext = createContext(null);

// En _layout.js envuelve la app, DENTRO de SesionProvider (porque usa la sesión).
export function CarritoProvider({ children }) {
  // Lista de productos: [{ id, nombre, precio, cantidad }]
  const [productos, setProductos] = useState([]);
  const { usuario } = useSesion();

  // Punto acordado: al cerrar sesión (usuario pasa a null) el carrito se
  // vacía, para que el siguiente usuario no vea productos de otro.
  useEffect(() => {
    if (!usuario) setProductos([]);
  }, [usuario]);

  // setProductos(lista => ...) recibe la lista actual y guarda la nueva
  // que devuelven las funciones de utils/carrito.js.
  const valor = useMemo(
    () => ({
      productos,
      total: calcularTotal(productos),
      agregar: (producto) => setProductos((lista) => agregarProducto(lista, producto)),
      cambiarCantidad: (id, cantidad) => setProductos((lista) => cambiarCantidadProducto(lista, id, cantidad)),
      quitar: (id) => setProductos((lista) => quitarProducto(lista, id)),
      vaciar: () => setProductos([]),
    }),
    [productos]
  );

  return <CarritoContext.Provider value={valor}>{children}</CarritoContext.Provider>;
}

// Hook para usar el carrito desde cualquier pantalla, por ejemplo:
//   const { productos, total, agregar } = useCarrito();
export function useCarrito() {
  const contexto = useContext(CarritoContext);
  if (!contexto) throw new Error('useCarrito debe usarse dentro de <CarritoProvider>');
  return contexto;
}
