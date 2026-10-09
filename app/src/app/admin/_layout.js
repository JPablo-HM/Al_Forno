// Sección del administrador (HU-14 a HU-19).
// Solo se puede abrir con una sesión de rol ADMIN (ver src/app/_layout.js).
import { Stack } from 'expo-router';
import { COLORES } from '../../config/config';

export default function LayoutAdmin() {
  return (
    // Pila propia del administrador: abajo las pestañas (tabs) y, encima de
    // ellas, las pantallas de detalle que se abren desde las pestañas.
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: COLORES.negro },
        headerTintColor: COLORES.crema,
        headerTitleStyle: { fontWeight: 'bold' },
        contentStyle: { backgroundColor: COLORES.crema },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="pedido/[id]" options={{ title: 'Detalle del pedido' }} />
      <Stack.Screen name="historial-pedidos" options={{ title: 'Historial de pedidos' }} />
      <Stack.Screen name="producto/[id]" options={{ title: 'Producto' }} />
      <Stack.Screen name="promociones" options={{ title: 'Promociones' }} />
      <Stack.Screen name="promocion/[id]" options={{ title: 'Promoción' }} />
      <Stack.Screen name="agenda/[id]" options={{ title: 'Agenda' }} />
    </Stack>
  );
}
