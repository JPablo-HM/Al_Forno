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

// Segundos que han pasado desde una fecha guardada en MySQL.
// La fecha llega como texto en hora de Costa Rica ('2026-10-15 20:30:05').
// dayjs.tz(texto, ZONA) la interpreta en esa zona antes de comparar.
function segundosDesde(fechaTexto) {
  return ahora().diff(dayjs.tz(fechaTexto, ZONA), 'second');
}

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
  'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

// '2026-10-17' → 'Sábado 17 de octubre'
function formatearFechaLarga(fechaTexto) {
  const f = dayjs.tz(fechaTexto, ZONA);
  return `${DIAS[f.day()]} ${f.date()} de ${MESES[f.month()]}`;
}

module.exports = { ahora, ZONA, diaSemanaIso, formatearHora, segundosDesde, formatearFechaLarga };
