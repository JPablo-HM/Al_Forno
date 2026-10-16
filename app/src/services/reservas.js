// Servicios del módulo Reservas (HU-10, HU-11).
// Todas piden el token de la sesión: la API sabe quién es el cliente por él.
import { pedir } from './api';

// HU-10 · Horas de un día con sus espacios → GET /api/reservas/horas?fecha=YYYY-MM-DD
// Devuelve [{ hora: '18:00', horaTexto: '6:00 p.m.', libres, disponible }]
export const listarHoras = (token, fecha) => pedir(`/reservas/horas?fecha=${fecha}`, { token });

// HU-10 · Crear reserva → POST /api/reservas
// datos = { fecha, hora, personas }
export const crearReserva = (token, datos) => pedir('/reservas', { metodo: 'POST', cuerpo: datos, token });

// HU-11 · Mis reservas de hoy en adelante → GET /api/reservas
export const listarMisReservas = (token) => pedir('/reservas', { token });

// HU-11 · Cancelar una reserva confirmada → PATCH /api/reservas/:id/cancelar
export const cancelarReserva = (token, id) => pedir(`/reservas/${id}/cancelar`, { metodo: 'PATCH', token });
