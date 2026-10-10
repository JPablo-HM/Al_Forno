// CAPA LÓGICA DE NEGOCIO (servicio) del módulo Información (HU-04, 05, 06).
// Decide qué datos salen hacia la app y en qué formato.
const informacionRepositorio = require('./informacion.repositorio');
const { RESTAURANTE, HORARIO } = require('../../config/restaurante');
const { ahora, diaSemanaIso, formatearHora } = require('../../utils/tiempo');

// HU-04 · Horario de la semana (información quemada en config/restaurante.js).
// Solo se muestra la tabla de los 7 días; no se calcula si está abierto.
// Devuelve [{ id, dia, horas, esHoy }]. esHoy solo sirve para resaltar el
// día actual en la app.
function obtenerHorario() {
  const hoy = diaSemanaIso(ahora());

  return HORARIO.map((d) => ({
    id: d.id,
    dia: d.dia,
    // '17:00' y '23:00' → '5:00 p.m. – 11:00 p.m.'
    horas: d.abierto ? `${formatearHora(d.apertura)} – ${formatearHora(d.cierre)}` : 'Cerrado',
    esHoy: d.id === hoy,
  }));
}

// HU-05 · Ubicación y contacto. Quemado en config/restaurante.js.
function obtenerRestaurante() {
  return RESTAURANTE;
}

// HU-06 · Promociones activas. Los días y las fechas vienen escritos en la
// descripción. Si no hay, devuelve [] y la app muestra
// "No hay promociones por el momento".
async function listarPromociones() {
  return informacionRepositorio.listarPromocionesActivas();
}

module.exports = { obtenerHorario, obtenerRestaurante, listarPromociones };
