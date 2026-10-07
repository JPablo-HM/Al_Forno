// Menú inferior del panel de administración (HU-14).
// Pedidos · Reservas · Menú · Agenda · Más
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORES } from '../../../config/config';

function icono(nombre) {
  return ({ color, size }) => <Ionicons name={nombre} color={color} size={size} />;
}

export default function TabsAdmin() {
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
      <Tabs.Screen name="index" options={{ title: 'Pedidos', headerTitle: 'Pedidos entrantes', tabBarIcon: icono('receipt-outline') }} />
      <Tabs.Screen name="reservas" options={{ title: 'Reservas', headerTitle: 'Reservas del día', tabBarIcon: icono('calendar-outline') }} />
      <Tabs.Screen name="menu" options={{ title: 'Menú', headerTitle: 'Productos', tabBarIcon: icono('pizza-outline') }} />
      <Tabs.Screen name="agenda" options={{ title: 'Agenda', headerTitle: 'Agenda y eventos', tabBarIcon: icono('musical-notes-outline') }} />
      <Tabs.Screen name="mas" options={{ title: 'Más', tabBarIcon: icono('ellipsis-horizontal') }} />
    </Tabs>
  );
}
