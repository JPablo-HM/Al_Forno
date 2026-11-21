// Servicio del módulo Tipo de cambio.
// Cada función llama a pedir() de api.js con su ruta de la API.
import { pedir } from './api';

// Tipo de cambio del dólar del BCCR → GET /api/tipo-cambio
// Devuelve { compra, venta, fecha }   ej. { compra: 441.91, venta: 446.17, fecha: '2026-11-21' }
export const obtenerTipoCambio = () => pedir('/tipo-cambio');
