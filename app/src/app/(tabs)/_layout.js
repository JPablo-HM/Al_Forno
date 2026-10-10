// Menú inferior de la app de clientes (mapa de navegación):
// Inicio · Menú · Agenda · Reservas · Perfil
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORES } from '../../config/config';
import BotonCarrito from '../../components/BotonCarrito';

// Devuelve la función que dibuja el ícono de una pestaña. La barra le pasa
// el color (cambia si la pestaña está activa) y el tamaño. Los nombres de
// los íconos son de Ionicons (@expo/vector-icons).
function icono(nombre) {
  return ({ color, size }) => <Ionicons name={nombre} color={color} size={size} />;
}

export default function TabsCliente() {
  return (
    // Tabs = menú inferior. Cada Tabs.Screen apunta a un archivo de esta carpeta:
    // name="index" → index.js, name="menu" → menu.js, etc.
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
      <Tabs.Screen name="index" options={{ title: 'Inicio', headerTitle: 'AL FORNO', tabBarIcon: icono('home-outline') }} />
      {/* headerRight: el ícono del carrito a la derecha de la barra superior */}
      <Tabs.Screen name="menu" options={{ title: 'Menú', tabBarIcon: icono('pizza-outline'), headerRight: () => <BotonCarrito /> }} />
      <Tabs.Screen name="agenda" options={{ title: 'Agenda', tabBarIcon: icono('musical-notes-outline') }} />
      <Tabs.Screen name="reservas" options={{ title: 'Reservas', tabBarIcon: icono('calendar-outline') }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: icono('person-outline') }} />
    </Tabs>
  );
}
