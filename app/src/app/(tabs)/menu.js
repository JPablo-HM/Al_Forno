// =====================================================================
// PANTALLA · Menú (pestaña del cliente)
// Ruta: /menu   ·   Historia: HU-03
// Quién la ve: visitantes y clientes (no necesita sesión)
// Se llega desde: pestaña "Menú" del menú inferior
// Lleva a: /carrito (ícono 🛒 de la barra superior; pide sesión)
//
// Pide el menú a la API (GET /api/menu), que ya viene agrupado por
// categoría. Arriba están los botones de categoría (Pizzas, Cucina
// italiana, Coctelería, Cervezas): al tocar uno se muestran solo sus
// productos. Cada producto es un <TarjetaProducto>.
// =====================================================================
import { useEffect, useState } from 'react';
import { ScrollView, View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { obtenerMenu } from '../../services/menu';
import TarjetaProducto from '../../components/TarjetaProducto';
import { COLORES } from '../../config/config';

export default function Menu() {
  // Estados de la pantalla:
  //   menu        → lo que devuelve la API: [{ categoria, productos }]
  //   seleccionada → nombre de la categoría que se está viendo
  const [menu, setMenu] = useState([]);
  const [seleccionada, setSeleccionada] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Se ejecuta una sola vez, cuando la pantalla aparece.
  useEffect(() => {
    obtenerMenu()
      .then((datos) => {
        setMenu(datos);
        // Al abrir, se muestra la primera categoría (Pizzas)
        if (datos.length > 0) setSeleccionada(datos[0].categoria);
      })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) {
    return <ActivityIndicator style={estilos.centro} color={COLORES.terracota} />;
  }
  if (error) {
    return <Text style={[estilos.centro, estilos.error]}>No se pudo cargar el menú. {error}</Text>;
  }

  // find() busca la categoría seleccionada dentro del menú
  const categoriaActual = menu.find((c) => c.categoria === seleccionada);

  return (
    <View style={estilos.fondo}>
      {/* Botones de categoría (se desplazan hacia los lados si no caben) */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.categorias}>
        {menu.map((c) => {
          const activa = c.categoria === seleccionada;
          return (
            <Pressable
              key={c.categoria}
              onPress={() => setSeleccionada(c.categoria)}
              style={[estilos.categoria, activa && estilos.categoriaActiva]}
            >
              <Text style={[estilos.categoriaTexto, activa && estilos.categoriaTextoActiva]}>{c.categoria}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Productos de la categoría seleccionada */}
      <ScrollView contentContainerStyle={estilos.lista}>
        {categoriaActual
          ? categoriaActual.productos.map((p) => <TarjetaProducto key={p.id} producto={p} />)
          : <Text style={estilos.vacio}>No hay productos en el menú por el momento.</Text>}
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: COLORES.crema },
  centro: { marginTop: 40, textAlign: 'center', paddingHorizontal: 20 },
  error: { color: COLORES.terracotaOscuro },
  categorias: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  categoria: { borderWidth: 1, borderColor: COLORES.textoSuave, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16 },
  categoriaActiva: { backgroundColor: COLORES.negro, borderColor: COLORES.negro },
  categoriaTexto: { color: COLORES.texto },
  categoriaTextoActiva: { color: COLORES.crema, fontWeight: 'bold' },
  lista: { paddingHorizontal: 16, paddingBottom: 32 },
  vacio: { color: COLORES.textoSuave, textAlign: 'center', marginTop: 20 },
});
