// CAPA LÓGICA DE NEGOCIO (servicio) del módulo Reservas (HU-10, HU-11).
//
// Decisión del proyecto: las reservas NO dependen del horario del
// restaurante. Todos los días se ofrecen las mismas horas (HORAS_RESERVA).
// Reglas que sí se aplican aquí:
//   · fecha: hoy, mañana o pasado mañana
//   · la hora debe ser una de HORAS_RESERVA y, si es hoy, que no haya pasado
// Reglas que aplica la base (sp_CrearReserva), porque dependen de las otras reservas:
//   · máximo MAXIMO_POR_HORA reservas por hora (la API le pasa el número)
//   · 1 reserva por día por cliente
// La cantidad de personas (1 a 8) la valida la ruta.
//
// El motivo y el comentario se quitaron de la app y de la base (decisión del proyecto).
const reservasRepositorio = require('./reservas.repositorio');
const { ahora, ZONA, formatearHora, formatearFechaLarga } = require('../../utils/tiempo');
const dayjs = require('dayjs');
const { errorCon } = require('../../utils/errores');

// Reglas sencillas para que la demo y las pruebas sean rápidas (24 nov 2026):
// Horas que se ofrecen cada día: 6, 7, 8 y 9 p.m.
const HORAS_RESERVA = ['18:00', '19:00', '20:00', '21:00'];
const MAXIMO_POR_HORA = 2; // única definición: también se le pasa a sp_CrearReserva
const DIAS_ANTICIPACION = 2; // hoy + 2 días = hoy, mañana y pasado mañana

// Revisa la fecha ('YYYY-MM-DD'): hoy, mañana o pasado mañana.
function validarFecha(fecha) {
  const hoy = ahora().format('YYYY-MM-DD');
  const limite = ahora().add(DIAS_ANTICIPACION, 'day').format('YYYY-MM-DD');
  // Las fechas en formato YYYY-MM-DD se pueden comparar como texto.
  if (fecha < hoy) throw errorCon(400, 'No se puede reservar en una fecha pasada');
  if (fecha > limite) throw errorCon(400, 'Solo se puede reservar para hoy, mañana o pasado mañana');
}

// true si la fecha es hoy y esa hora ya pasó (no se puede reservar).
function yaPaso(fecha, hora) {
  return dayjs.tz(`${fecha} ${hora}`, ZONA).isBefore(ahora());
}

// Da forma a una reserva para la app.
function armarReserva(r) {
  const hora = r.hora.slice(0, 5); // '18:00:00' → '18:00'
  return {
    id: r.id,
    fecha: r.fecha,
    fechaTexto: formatearFechaLarga(r.fecha), // 'Sábado 17 de octubre'
    hora,
    horaTexto: formatearHora(hora),           // '6:00 p.m.'
    personas: r.personas,
    estado: r.estado,
  };
}

// HU-10 · Horas de una fecha con sus espacios libres.
// Devuelve [{ hora: '18:00', horaTexto: '6:00 p.m.', libres: 1, disponible: true }]
// disponible = false si ya tiene MAXIMO_POR_HORA reservas ("Sin espacio") o si ya pasó.
async function listarHoras(fecha) {
  validarFecha(fecha);
  const ocupacion = await reservasRepositorio.listarOcupacion(fecha);

  return HORAS_RESERVA.map((hora) => {
    const fila = ocupacion.find((o) => o.hora.startsWith(hora));
    // Math.max: nunca menos de 0 (por si hay reservas de cuando el máximo era 3)
    const libres = Math.max(0, MAXIMO_POR_HORA - (fila ? fila.ocupadas : 0));
    return {
      hora,
      horaTexto: formatearHora(hora),
      libres,
      disponible: libres > 0 && !yaPaso(fecha, hora),
    };
  });
}

// ★ HU-10 · Crear la reserva.
async function crearReserva(usuarioId, datos) {
  validarFecha(datos.fecha);
  if (!HORAS_RESERVA.includes(datos.hora)) throw errorCon(400, 'Escoge una de las horas disponibles');
  if (yaPaso(datos.fecha, datos.hora)) throw errorCon(400, 'Esa hora ya pasó. Escoge otra');

  const reserva = await reservasRepositorio.crearReserva(usuarioId, datos, MAXIMO_POR_HORA);
  return armarReserva(reserva);
}

// HU-11 · Mis reservas de hoy en adelante.
async function listarMisReservas(usuarioId) {
  const reservas = await reservasRepositorio.listarReservasCliente(usuarioId);
  return reservas.map(armarReserva);
}

// HU-11 · Cancelar una reserva confirmada (el espacio queda libre).
async function cancelarReserva(id, usuarioId) {
  const cancelada = await reservasRepositorio.cancelarReserva(id, usuarioId);
  if (!cancelada) throw errorCon(404, 'La reserva no existe o ya estaba cancelada');
  return { id, estado: 'Cancelada' };
}

module.exports = { listarHoras, crearReserva, listarMisReservas, cancelarReserva };
