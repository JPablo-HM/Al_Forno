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

// Día de la semana en numeración ISO, igual que la tabla dia_semana:
// 1 = lunes … 7 = domingo. dayjs usa 0 = domingo, por eso se corrige.
function diaSemanaIso(momento) {
  return momento.day() === 0 ? 7 : momento.day();
}

// '17:30:00' → 1050 (minutos desde la medianoche). Sirve para comparar horas.
function aMinutos(hora) {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

// '17:00:00' → '5:00 p.m.' · '12:00:00' → '12:00 m.d.' · '01:00:00' → '1:00 a.m.'
function formatearHora(hora) {
  const [h, m] = hora.split(':').map(Number);
  const minutos = String(m).padStart(2, '0');
  if (h === 12 && m === 0) return '12:00 m.d.';
  const sufijo = h < 12 ? 'a.m.' : 'p.m.';
  const hora12 = h % 12 === 0 ? 12 : h % 12;
  return `${hora12}:${minutos} ${sufijo}`;
}

// 'a la 1:00 a.m.' (singular) o 'a las 5:00 p.m.' (plural)
function aLas(hora) {
  const texto = formatearHora(hora);
  return texto.startsWith('1:') ? `a la ${texto}` : `a las ${texto}`;
}

// '2026-10-31' → '31 oct 2026'
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
function formatearFecha(fecha) {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  return `${dia} ${MESES[mes - 1]} ${anio}`;
}

// HU-04 · ¿El local está abierto en este momento?
// Recibe las 7 filas del horario ({ dia_semana_id, dia, abierto, hora_apertura,
// hora_cierre, cierra_dia_siguiente }) y devuelve { abierto, mensaje }.
// Revisa en este orden:
//   1. ¿Sigue abierto el turno de AYER? (viernes y sábado cierran a la 1:00 a.m.)
//   2. ¿Está abierto el turno de HOY?
//   3. Si está cerrado, ¿cuándo vuelve a abrir?
function estadoDelLocal(horario, momento = ahora()) {
  const hoy = diaSemanaIso(momento);
  const ayer = hoy === 1 ? 7 : hoy - 1;
  const minutosAhora = momento.hour() * 60 + momento.minute();
  const buscarDia = (id) => horario.find((d) => d.dia_semana_id === id);

  // 1. Turno de ayer que pasa de la medianoche
  const diaAyer = buscarDia(ayer);
  if (diaAyer && diaAyer.abierto && diaAyer.cierra_dia_siguiente
      && minutosAhora < aMinutos(diaAyer.hora_cierre)) {
    return { abierto: true, mensaje: `Cierra hoy ${aLas(diaAyer.hora_cierre)}` };
  }

  // 2. Turno de hoy
  const diaHoy = buscarDia(hoy);
  if (diaHoy && diaHoy.abierto) {
    const apertura = aMinutos(diaHoy.hora_apertura);
    const cierre = aMinutos(diaHoy.hora_cierre);
    // Si cierra al día siguiente, desde la apertura hasta medianoche está abierto.
    if (minutosAhora >= apertura && (diaHoy.cierra_dia_siguiente || minutosAhora < cierre)) {
      const cuando = diaHoy.cierra_dia_siguiente ? 'Cierra' : 'Cierra hoy';
      return { abierto: true, mensaje: `${cuando} ${aLas(diaHoy.hora_cierre)}` };
    }
    if (minutosAhora < apertura) {
      return { abierto: false, mensaje: `Abre hoy ${aLas(diaHoy.hora_apertura)}` };
    }
  }

  // 3. Está cerrado: busca el próximo día que abre (mañana, pasado mañana…)
  for (let i = 1; i <= 7; i++) {
    const id = ((hoy - 1 + i) % 7) + 1;
    const dia = buscarDia(id);
    if (dia && dia.abierto) {
      const cuando = i === 1 ? 'mañana' : `el ${dia.dia.toLowerCase()}`;
      return { abierto: false, mensaje: `Abre ${cuando} ${aLas(dia.hora_apertura)}` };
    }
  }
  return { abierto: false, mensaje: 'Horario no disponible' };
}

module.exports = { ahora, ZONA, diaSemanaIso, formatearHora, formatearFecha, estadoDelLocal };
