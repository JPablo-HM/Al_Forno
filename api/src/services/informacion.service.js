// CAPA LÓGICA DE NEGOCIO (servicio) del módulo Información (HU-04, 05, 06).
// Decide qué datos salen hacia la app y en qué formato.
const informacionRepository = require('../repositories/informacion.repository');
const { RESTAURANTE, HORARIO } = require('../config/restaurante');
const { ahora, diaSemanaIso, formatearHora, estadoDelLocal } = require('../utils/tiempo');

// HU-04 · Horario de la semana + indicador "Abierto ahora" / "Cerrado".
// El horario está quemado en config/restaurante.js (no usa la base de datos).
function obtenerHorario() {
  // Se toma la hora una sola vez para que "hoy" y el estado coincidan.
  const momento = ahora();
  const hoy = diaSemanaIso(momento);

  return {
    // La regla de "abierto o cerrado" vive en utils/tiempo.js
    estado: estadoDelLocal(HORARIO, momento),
    // Lista lista para mostrar: la app no tiene que formatear horas.
    dias: HORARIO.map((d) => ({
      id: d.id,
      dia: d.dia,
      horas: d.abierto ? `${formatearHora(d.apertura)} – ${formatearHora(d.cierre)}` : 'Cerrado',
      esHoy: d.id === hoy,
    })),
  };
}

// HU-05 · Ubicación y contacto. Quemado en config/restaurante.js.
function obtenerRestaurante() {
  return RESTAURANTE;
}

// HU-06 · Promociones activas. Los días y las fechas vienen escritos en la
// descripción. Si no hay, devuelve [] y la app muestra
// "No hay promociones por el momento".
async function listarPromociones() {
  return informacionRepository.listarPromocionesActivas();
}

module.exports = { obtenerHorario, obtenerRestaurante, listarPromociones };
