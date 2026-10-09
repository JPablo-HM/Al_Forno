// Punto de entrada: carga las variables de entorno y enciende el servidor.
require('dotenv').config();
const app = require('./app');

// process.env tiene las variables del .env. Si no hay PORT, usa 3000.
const PORT = process.env.PORT || 3000;

// '0.0.0.0' = escuchar en todas las interfaces de red, no solo en localhost.
// Así el emulador (que entra por 10.0.2.2) puede llegar a la API.
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API de AL FORNO escuchando en http://localhost:${PORT}/api`);
});
