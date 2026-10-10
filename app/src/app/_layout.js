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
import { CarritoProvider } from '../context/CarritoContext';
import { COLORES } from '../config/config';

// RootLayout es lo primero que se dibuja. Envuelve toda la app con
// SesionProvider (useSesion) y CarritoProvider (useCarrito). El carrito va
// DENTRO de la sesión porque la usa: al cerrar sesión se vacía.
export default function RootLayout() {
  return (
    <SesionProvider>
      <CarritoProvider>
        <Navegacion />
        {/* Barra de estado del teléfono (hora, batería) con letras claras */}
        <StatusBar style="light" />
      </CarritoProvider>
    </SesionProvider>
  );
}

// Va separado de RootLayout porque useSesion() solo funciona DENTRO del
// SesionProvider. Cada vez que la sesión cambia, esta función se vuelve a
// ejecutar y los "guard" de abajo se recalculan.
function Navegacion() {
  const { usuario, esCliente, esAdmin } = useSesion();

  return (
    // Stack = navegación en pila: cada pantalla nueva se pone encima y la
    // flecha "atrás" regresa. screenOptions da el estilo común de la barra
    // superior (fondo negro, letras crema). Cada Stack.Screen recibe el nombre
    // del archivo (sin .js) y su título.
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
        <Stack.Screen name="mis-pedidos/index" options={{ title: 'Mis pedidos' }} />
        <Stack.Screen name="mis-pedidos/[id]" options={{ title: 'Pedido' }} />
        <Stack.Screen name="nueva-reserva" options={{ title: 'Nueva reserva' }} />
        <Stack.Screen name="comprar-entradas/[id]" options={{ title: 'Pago de entradas' }} />
        <Stack.Screen name="mis-tickets/index" options={{ title: 'Mis tickets' }} />
      </Stack.Protected>

      {/* Solo administrador */}
      <Stack.Protected guard={esAdmin}>
        <Stack.Screen name="admin" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}
