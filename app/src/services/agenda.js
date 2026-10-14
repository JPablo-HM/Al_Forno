// Servicios del módulo Agenda.
// Cada función llama a pedir() de api.js con su ruta de la API.
import { pedir } from './api';

// HU-12 · Agenda de actividades → GET /api/agenda
// Devuelve [{ id, dias, nombre, descripcion }]
export const listarAgenda = () => pedir('/agenda');
