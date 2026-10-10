// Servicios del módulo Menú.
// Cada función llama a pedir() de api.js con su ruta de la API.
import { pedir } from './api';

// HU-03 · Menú → GET /api/menu
// Devuelve [{ categoria, productos: [{ id, nombre, descripcion, precio }] }]
export const obtenerMenu = () => pedir('/menu');
