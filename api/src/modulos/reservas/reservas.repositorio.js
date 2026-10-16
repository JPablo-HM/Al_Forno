// CAPA ACCESO A DATOS (repositorio) del módulo Reservas (HU-10, HU-11).
// Es la única capa que habla con MySQL: solo llama procedimientos almacenados.
const pool = require('../../config/db');

// HU-10 · Cuántas reservas confirmadas tiene cada hora de una fecha
// → sp_ListarOcupacion. Devuelve [{ hora: '18:00:00', ocupadas: 2 }].
// Las horas sin reservas no aparecen.
async function listarOcupacion(fecha) {
  const [resultados] = await pool.query('CALL sp_ListarOcupacion(?)', [fecha]);
  return resultados[0];
}

// ★ HU-10 · Crea la reserva → sp_CrearReserva (con CANDADO GET_LOCK).
// motivo: siempre 'Reserva de mesa' · comentario: siempre NULL (no se usan en esta versión).
// La base revisa las reglas que dependen de otras reservas:
// máximo 3 por hora y 1 por día por cliente (error 409 si no se cumple).
async function crearReserva(usuarioId, { fecha, hora, personas, motivo, comentario }) {
  const [resultados] = await pool.query('CALL sp_CrearReserva(?, ?, ?, ?, ?, ?)', [
    usuarioId, fecha, hora, personas, motivo, comentario,
  ]);
  return resultados[0][0];
}

// HU-11 · Mis reservas de hoy en adelante → sp_ListarReservasCliente
async function listarReservasCliente(usuarioId) {
  const [resultados] = await pool.query('CALL sp_ListarReservasCliente(?)', [usuarioId]);
  return resultados[0];
}

// HU-11 · Cancela una reserva CONFIRMADA del cliente → sp_CancelarReserva
// Devuelve true si se canceló; false si no existe, es de otro cliente
// o ya estaba cancelada.
async function cancelarReserva(id, usuarioId) {
  const [resultados] = await pool.query('CALL sp_CancelarReserva(?, ?)', [id, usuarioId]);
  return resultados[0][0].cancelada === 1;
}

module.exports = { listarOcupacion, crearReserva, listarReservasCliente, cancelarReserva };
