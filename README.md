# AL FORNO · App móvil

Proyecto universitario: app móvil para la pizzería AL FORNO.

## Estructura

```
al_forno/
 ├─ app/        App móvil (React Native + Expo)
 │   └─ src/
 │       ├─ app/          Pantallas (cada archivo es una pantalla; Expo Router)
 │       ├─ components/   Piezas reutilizables (tarjetas, secciones, botones)
 │       ├─ context/      Datos compartidos entre pantallas: sesión y carrito
 │       ├─ services/     Llamadas a la API (api.js es el único que usa fetch)
 │       ├─ utils/        Funciones de apoyo (formato de colones, reglas del carrito)
 │       └─ config/       Dirección de la API y colores
 ├─ api/        API REST (Node.js + Express)
 │   └─ src/
 │       ├─ modulos/      Un módulo por carpeta, con sus 3 capas:
 │       │    └─ menu/      menu.rutas.js → menu.servicio.js → menu.repositorio.js → MySQL
 │       ├─ config/       Conexión a MySQL (db.js) y datos fijos del restaurante
 │       ├─ middlewares/  Manejo central de errores
 │       └─ utils/        Fechas y horas en hora de Costa Rica
 └─ database/   Scripts SQL (tablas, procedimientos, datos iniciales)
```

## Arquitectura en 5 capas

```
1. App (pantalla) ─→ services/api.js ─[internet]─→ 2. API (<modulo>.rutas.js)
   ─→ 3. Lógica de negocio (<modulo>.servicio.js) ─→ 4. Acceso a datos (<modulo>.repositorio.js)
   ─→ 5. MySQL (procedimiento almacenado: CALL sp_...)
```

Todas las funciones siguen este mismo camino. Para ver cómo funciona un módulo,
basta abrir su carpeta en `api/src/modulos/`.

## Cómo se conecta cada pantalla

**Ya funcionan:**

| Pantalla (app/src/app/) | Servicio de la app | Endpoint | Módulo de la API | Procedimiento / origen |
|---|---|---|---|---|
| Inicio · Horario — `(tabs)/index.js` | `obtenerHorario()` | `GET /api/horario` | informacion | Quemado en `config/restaurante.js` |
| Inicio · Ubicación — `(tabs)/index.js` | `obtenerRestaurante()` | `GET /api/restaurante` | informacion | Quemado en `config/restaurante.js` |
| Inicio · Promociones — `(tabs)/index.js` | `listarPromociones()` | `GET /api/promociones` | informacion | `sp_ListarPromocionesActivas` |
| Menú — `(tabs)/menu.js` | `obtenerMenu()` | `GET /api/menu` | menu | `sp_ListarMenu` |
| Carrito y Resumen — `carrito.js`, `resumen-pedido.js` | — | — | — | Solo en la app (`context/CarritoContext.js`) |
| Iniciar sesión — `login.js` | `login()` (prueba) | — | — | Usuarios de prueba en `services/auth.js` |
| (Prueba de conexión) | — | `GET /api/salud` | salud | `SELECT 1` |

**Pendientes** (plantillas; los procedimientos ya existen en la base):

| Pantalla | Módulo de la API | Procedimientos |
|---|---|---|
| Registro / Perfil | cuenta | `sp_RegistrarUsuario`, `sp_ObtenerUsuarioPorCorreo`, `sp_ObtenerUsuario` |
| Pago → Pedido (`pago.js` → `mis-pedidos/[id].js`) y Mis pedidos | pedidos | `sp_CrearPedido`, `sp_ObtenerPedido`, `sp_ListarPedidosCliente` |
| Reservas (pestaña) y Nueva reserva | reservas | `sp_CrearReserva`, `sp_ListarOcupacion`, `sp_ListarReservasCliente`, `sp_CancelarReserva` |
| Agenda (pestaña) | agenda | `sp_ListarAgenda` |
| Pago de entradas y Mis tickets | tickets | `sp_ComprarTickets`, `sp_ListarTicketsCliente` |
| Admin · Pedidos e Historial | pedidos | `sp_ListarPedidosActivos`, `sp_ListarHistorialPedidos`, `sp_CambiarEstadoPedido` |
| Admin · Reservas | reservas | `sp_ListarReservasDia`, `sp_ListarOcupacion`, `sp_CancelarReserva` |
| Admin · Menú y Producto | menu | `sp_ListarMenu`, `sp_ObtenerProducto`, `sp_CrearProducto`, `sp_EditarProducto`, `sp_EliminarProducto` |
| Admin · Agenda | agenda | `sp_ListarAgendaAdmin`, `sp_ObtenerAgenda`, `sp_CrearAgenda`, `sp_EditarAgenda`, `sp_CambiarEstadoAgenda` |
| Admin · Promociones | informacion | `sp_ListarPromociones`, `sp_ObtenerPromocion`, `sp_CrearPromocion`, `sp_EditarPromocion`, `sp_CambiarEstadoPromocion` |

## Cómo correr el proyecto

1. **Base de datos:** ejecutar en MySQL Workbench, en orden, los scripts de `database/`.
2. **API:**
   ```
   cd api
   npm install
   copy .env.example .env   (y poner los datos de MySQL)
   npm run dev
   ```
   Probar en el navegador: http://localhost:3000/api/salud
3. **App:** abrir el emulador de Android y luego
   ```
   cd app
   npm install
   npx expo start --clear
   ```
   Presionar `a` para abrir la app en el emulador.

   Para instalar librerías nuevas en la app usar `npx expo install <librería>`
   (no `npm install`), así quedan en versiones compatibles con Expo.

   Si un cambio no se ve en la app (sobre todo en `_layout.js` o en los
   contextos), reiniciar con `npx expo start --clear`.

4. **En un iPhone (Expo Go):** iPhone y computadora en la misma Wi-Fi, sesión
   iniciada con la misma cuenta de Expo en la terminal (`npx expo login`) y en
   Expo Go, y escanear el QR con la cámara. La app detecta sola la dirección
   de la API (`app/src/config/config.js`).

## Navegación de la app (Expo Router)

Cada archivo dentro de `app/src/app/` es una pantalla y su ruta sale de la carpeta.
Las carpetas entre paréntesis, como `(tabs)`, agrupan pantallas sin aparecer en la
ruta; `[id]` es una parte variable (ej. `/mis-pedidos/15`); `_layout.js` define
cómo se navega dentro de esa carpeta.

```
app/src/app/
 ├─ _layout.js     Navegación principal y protección por rol (visitante, cliente, administrador)
 ├─ (tabs)/        Menú inferior del cliente: Inicio · Menú · Agenda · Reservas · Perfil
 ├─ login.js, registro.js                                  (solo sin sesión)
 ├─ carrito.js, resumen-pedido.js, pago.js                 (requieren sesión de cliente)
 ├─ mis-pedidos/ (lista y [id]: estado y comprobante)
 ├─ nueva-reserva.js, comprar-entradas/[id].js, mis-tickets/
 └─ admin/         Panel del administrador: Pedidos · Reservas · Menú · Agenda · Más
```

Mientras no exista el login real con la API, la pantalla **Iniciar sesión** tiene
dos botones de prueba (cliente y administrador) para recorrer la navegación.
