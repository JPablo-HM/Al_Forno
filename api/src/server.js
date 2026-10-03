// Punto de entrada: carga las variables de entorno y enciende el servidor.
require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API de AL FORNO escuchando en http://localhost:${PORT}/api`);
});
