// CAPA LÓGICA DE NEGOCIO (servicio) del módulo Agenda (HU-12).
// Decide qué datos salen hacia la app y en qué formato.
//
// Este módulo NO tiene repositorio: la agenda no está en la base de
// datos, sino en config/agenda.js (igual que el horario de Inicio).
const { AGENDA } = require('../../config/agenda');
const { HORARIO } = require('../../config/restaurante');

// Convierte [2, 3] → 'Martes y miércoles' usando los nombres de HORARIO.
// [5, 6, 7] → 'Viernes, sábado y domingo'.
function nombrarDias(dias) {
  const nombres = dias.map((n, i) => {
    const nombre = HORARIO.find((d) => d.id === n).dia;
    // Solo el primero con mayúscula: 'Martes y miércoles'.
    return i === 0 ? nombre : nombre.toLowerCase();
  });
  if (nombres.length === 1) return nombres[0];
  return `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`;
}

// HU-12 · Agenda de actividades (solo informativa).
// Devuelve [{ id, dias, nombre, descripcion }]:
//   · dias: ya escritos como texto ('Martes y miércoles')
function listarAgenda() {
  return AGENDA.map((a) => ({
    id: a.id,
    dias: nombrarDias(a.dias),
    nombre: a.nombre,
    descripcion: a.descripcion,
  }));
}

module.exports = { listarAgenda };
