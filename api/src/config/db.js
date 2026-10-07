// Conexión a MySQL con un "pool" (varias conexiones reutilizables).
// Los datos salen del archivo .env.
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true,     // Fechas como texto ("2026-10-06 18:30:00"), sin conversiones
  timezone: '-06:00',    // Hora de Costa Rica (UTC-6, sin horario de verano)
});

// Cada conexión nueva trabaja en hora de Costa Rica. Así las columnas
// automáticas (fecha_creacion, fecha_actualizacion) no quedan en UTC.
pool.on('connection', (conexion) => {
  conexion.query("SET time_zone = '-06:00'");
});

module.exports = pool;
