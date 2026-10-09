// Toda la lógica de fechas y horas usa la zona horaria de Costa Rica.
// Ningún otro archivo debe calcular la hora por su cuenta.
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

// Plugins: utc (hora universal) y timezone (convertir a una zona horaria).
dayjs.extend(utc);
dayjs.extend(timezone);

const ZONA = process.env.TZ_APP || 'America/Costa_Rica';

// Uso: ahora().format('YYYY-MM-DD HH:mm:ss')  o  ahora().hour()
function ahora() {
  return dayjs().tz(ZONA);
}

// Día de la semana en numeración ISO, igual que HORARIO en config/restaurante.js:
// 1 = lunes … 7 = domingo. dayjs usa 0 = domingo, por eso se corrige.
function diaSemanaIso(momento) {
  return momento.day() === 0 ? 7 : momento.day();
}

// '17:00' → '5:00 p.m.' · '12:00' → '12:00 m.d.' · '01:00' → '1:00 a.m.'
function formatearHora(hora) {
  const [h, m] = hora.split(':').map(Number);
  const minutos = String(m).padStart(2, '0');
  if (h === 12 && m === 0) return '12:00 m.d.';
  const sufijo = h < 12 ? 'a.m.' : 'p.m.';
  const hora12 = h % 12 === 0 ? 12 : h % 12;
  return `${hora12}:${minutos} ${sufijo}`;
}

module.exports = { ahora, ZONA, diaSemanaIso, formatearHora };
