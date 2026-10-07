// Navegación principal de AL FORNO (Expo Router).
// Cada archivo dentro de src/app/ es una pantalla y su ruta sale de la carpeta.
//
// Las pantallas se agrupan con Stack.Protected según la sesión
// (mapa de navegación y HU-14):
//   · Visitantes y clientes: menú inferior (Inicio, Menú, Agenda, Reservas, Perfil).
//   · Solo sin sesión: Iniciar sesión y Registro.
//   · Solo clientes: carrito, pago, mis pedidos, reservas y tickets.
//   · Solo administrador: el panel /admin. El administrador no ve la app de clientes.
//
// Cuando la sesión cambia y la pantalla actual deja de estar permitida,
// Expo Router lleva a la primera pantalla disponible: al iniciar sesión el
// cliente vuelve a Inicio y el administrador entra directo a su panel.
//
// Importante: esto solo organiza la app. La seguridad real está en la API
// (middleware de roles), que valida el token en cada petición.
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SesionProvider, useSesion } from '../context/SesionContext';
import { COLORES } from '../config/config';

export default function RootLayout() {
  return (
    <SesionProvider>
      <Navegacion />
      <StatusBar style="light" />
    </SesionProvider>
  );
}

function Navegacion() {
  const { usuario, esCliente, esAdmin } = useSesion();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: COLORES.negro },
        headerTintColor: COLORES.crema,
        headerTitleStyle: { fontWeight: 'bold' },
        contentStyle: { backgroundColor: COLORES.crema },
      }}
    >
      {/* Visitantes y clientes (acceso libre) */}
      <Stack.Protected guard={!esAdmin}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="eventos/[id]" options={{ title: 'Evento especial' }} />
      </Stack.Protected>

      {/* Solo sin sesión */}
      <Stack.Protected guard={!usuario}>
        <Stack.Screen name="login" options={{ title: 'Iniciar sesión' }} />
        <Stack.Screen name="registro" options={{ title: 'Crear cuenta' }} />
      </Stack.Protected>

      {/* Solo clientes con sesión iniciada */}
      <Stack.Protected guard={esCliente}>
        <Stack.Screen name="carrito" options={{ title: 'Carrito' }} />
        <Stack.Screen name="resumen-pedido" options={{ title: 'Resumen del pedido' }} />
        <Stack.Screen name="pago" options={{ title: 'Pago' }} />
        <Stack.Screen name="comprobante/[id]" options={{ title: 'Comprobante', headerBackVisible: false }} />
        <Stack.Screen name="mis-pedidos/index" options={{ title: 'Mis pedidos' }} />
        <Stack.Screen name="mis-pedidos/[id]" options={{ title: 'Estado del pedido' }} />
        <Stack.Screen name="nueva-reserva" options={{ title: 'Nueva reserva' }} />
        <Stack.Screen name="reserva-confirmada/[id]" options={{ title: 'Reserva confirmada', headerBackVisible: false }} />
        <Stack.Screen name="mis-reservas" options={{ title: 'Mis reservas' }} />
        <Stack.Screen name="comprar-entradas/[id]" options={{ title: 'Pago de entradas' }} />
        <Stack.Screen name="mis-tickets/index" options={{ title: 'Mis tickets' }} />
        <Stack.Screen name="mis-tickets/[id]" options={{ title: 'Mi ticket' }} />
      </Stack.Protected>

      {/* Solo administrador */}
      <Stack.Protected guard={esAdmin}>
        <Stack.Screen name="admin" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}
