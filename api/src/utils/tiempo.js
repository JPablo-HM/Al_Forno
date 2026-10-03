// Toda la lógica de fechas y horas usa la zona horaria de Costa Rica.
// Ningún otro archivo debe calcular la hora por su cuenta.
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

const ZONA = process.env.TZ_APP || 'America/Costa_Rica';

function ahora() {
  return dayjs().tz(ZONA);
}

module.exports = { ahora, ZONA };
