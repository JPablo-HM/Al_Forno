import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, Text, View, Pressable, FlatList } from 'react-native';

// Datos de prueba (después vendrán de la API)
const PRODUCTOS = [
  { id: 1, nombre: 'Margherita', descripcion: 'Tomate, mozzarella fresca y albahaca', precio: 6500 },
  { id: 2, nombre: 'Diavola', descripcion: 'Tomate, mozzarella y salami picante', precio: 7800 },
  { id: 3, nombre: 'Quattro Formaggi', descripcion: 'Mozzarella, gorgonzola, parmesano y provolone', precio: 8200 },
];

// COMPONENTE: una tarjeta de producto. Recibe sus datos por PROPS.
function TarjetaProducto({ nombre, descripcion, precio, onAgregar }) {
  return (
    <View style={styles.tarjeta}>
      <View style={{ flex: 1 }}>
        <Text style={styles.nombre}>{nombre}</Text>
        <Text style={styles.descripcion}>{descripcion}</Text>
        <Text style={styles.precio}>₡{precio}</Text>
      </View>
      <Pressable style={styles.boton} onPress={onAgregar}>
        <Text style={styles.botonTexto}>Agregar</Text>
      </Pressable>
    </View>
  );
}

// COMPONENTE PRINCIPAL
export default function App() {
  // ESTADO: cuántos productos hay en el carrito
  const [carrito, setCarrito] = useState(0);

  return (
    <View style={styles.contenedor}>
      <Text style={styles.titulo}>AL FORNO</Text>
      <Text style={styles.carrito}>Productos en el carrito: {carrito}</Text>

      <FlatList
        data={PRODUCTOS}
        keyExtractor={(p) => String(p.id)}
        renderItem={({ item }) => (
          <TarjetaProducto
            nombre={item.nombre}
            descripcion={item.descripcion}
            precio={item.precio}
            onAgregar={() => setCarrito(carrito + 1)}
          />
        )}
      />
      <StatusBar style="light" />
    </View>
  );
}

// ESTILOS: parecido a CSS, pero escrito en JavaScript
const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#141110', paddingTop: 60, paddingHorizontal: 16 },
  titulo: { fontSize: 32, fontWeight: 'bold', color: '#F4ECE0', letterSpacing: 4 },
  carrito: { color: '#D4855C', marginBottom: 16, marginTop: 4 },
  tarjeta: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F4ECE0', padding: 16, borderRadius: 6, marginBottom: 12 },
  nombre: { fontSize: 18, fontWeight: 'bold', color: '#1C1815' },
  descripcion: { color: '#6D6159', marginVertical: 4 },
  precio: { color: '#B0512F', fontWeight: 'bold' },
  boton: { backgroundColor: '#B0512F', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 4, marginLeft: 12 },
  botonTexto: { color: '#FFFFFF', fontWeight: 'bold' },
});
