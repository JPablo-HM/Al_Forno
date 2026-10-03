# AL FORNO · App móvil

Proyecto universitario: app móvil para la pizzería AL FORNO.

## Estructura

```
al_forno/
 ├─ app/        App móvil (React Native + Expo)
 │   └─ src/    screens · components · navigation · services · config
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
   npx expo start
   ```
   Presionar `a` para abrir la app en el emulador.
