// Servicios del módulo Información (pantalla Inicio).
// Cada función llama a pedir() de api.js con su ruta de la API.
import { pedir } from './api';

// HU-04 · Horario → GET /api/horario
// Devuelve [{ id, dia, horas, esHoy }] (los 7 días)
export const obtenerHorario = () => pedir('/horario');

// HU-05 · Ubicación y contacto → GET /api/restaurante
// Devuelve { nombre, direccion, senas, telefono }
export const obtenerRestaurante = () => pedir('/restaurante');

// HU-06 · Promociones → GET /api/promociones
// Devuelve [{ id, titulo, descripcion }] (puede venir vacía)
export const listarPromociones = () => pedir('/promociones');
