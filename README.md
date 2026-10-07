# AL FORNO · App móvil

Proyecto universitario: app móvil para la pizzería AL FORNO.

## Estructura

```
al_forno/
 ├─ app/        App móvil (React Native + Expo)
 │   └─ src/    app (pantallas y rutas con Expo Router) · components · context · services · config
 ├─ api/        API REST (Node.js + Express)
 │   └─ src/    routes → controllers → services → repositories → MySQL
 └─ database/   Scripts SQL (tablas, procedimientos, datos iniciales)
```

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

## Navegación de la app (Expo Router)

Cada archivo dentro de `app/src/app/` es una pantalla y su ruta sale de la carpeta:

```
app/src/app/
 ├─ _layout.js     Navegación principal y protección por rol (visitante, cliente, administrador)
 ├─ (tabs)/        Menú inferior del cliente: Inicio · Menú · Agenda · Reservas · Perfil
 ├─ login.js, registro.js
 ├─ carrito.js, pago.js, mis-pedidos/, mis-tickets/ ...   (requieren sesión de cliente)
 └─ admin/         Panel del administrador: Pedidos · Reservas · Menú · Agenda · Más
```

Mientras no exista el login real con la API, la pantalla **Iniciar sesión** tiene
dos botones de prueba (cliente y administrador) para recorrer la navegación.
