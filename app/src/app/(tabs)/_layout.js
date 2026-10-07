// Menú inferior de la app de clientes (mapa de navegación):
// Inicio · Menú · Agenda · Reservas · Perfil
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORES } from '../../config/config';

function icono(nombre) {
  return ({ color, size }) => <Ionicons name={nombre} color={color} size={size} />;
}

export default function TabsCliente() {
  return (
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
      <Tabs.Screen name="menu" options={{ title: 'Menú', tabBarIcon: icono('pizza-outline') }} />
      <Tabs.Screen name="agenda" options={{ title: 'Agenda', tabBarIcon: icono('musical-notes-outline') }} />
      <Tabs.Screen name="reservas" options={{ title: 'Reservas', tabBarIcon: icono('calendar-outline') }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: icono('person-outline') }} />
    </Tabs>
  );
}
