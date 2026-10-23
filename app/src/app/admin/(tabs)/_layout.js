// Menú inferior del panel de administración (HU-14).
// Menú · Promociones · Más
// El administrador solo gestiona el menú y las promociones
// (Pedidos, Reservas y Agenda se quitaron del panel; la agenda es fija).
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORES } from '../../../config/config';

// Devuelve la función que dibuja el ícono de una pestaña. La barra le pasa
// el color (cambia si la pestaña está activa) y el tamaño. Los nombres de
// los íconos son de Ionicons (@expo/vector-icons).
function icono(nombre) {
  return ({ color, size }) => <Ionicons name={nombre} color={color} size={size} />;
}

export default function TabsAdmin() {
  return (
    // Tabs = menú inferior. Cada Tabs.Screen apunta a un archivo de esta carpeta:
    // name="index" → index.js (Menú), name="promociones" → promociones.js, etc.
    // title es el texto de la pestaña; headerTitle, el de la barra superior.
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: COLORES.negro },
        headerTintColor: COLORES.crema,
        headerTitleStyle: { fontWeight: 'bold' },
        tabBarActiveTintColor: COLORES.terracota,
        tabBarInactiveTintColor: COLORES.textoSuave,
        tabBarStyle: { backgroundColor: COLORES.cremaClara },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Menú', headerTitle: 'Productos', tabBarIcon: icono('pizza-outline') }} />
      <Tabs.Screen name="promociones" options={{ title: 'Promociones', headerTitle: 'Promociones', tabBarIcon: icono('pricetag-outline') }} />
      <Tabs.Screen name="mas" options={{ title: 'Más', tabBarIcon: icono('ellipsis-horizontal') }} />
    </Tabs>
  );
}
