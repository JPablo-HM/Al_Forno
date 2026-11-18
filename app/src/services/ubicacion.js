// Servicios del módulo Ubicación (HU-01 Registro).
// Llenan las 4 cajas del registro en cascada. Son públicas (sin token).
// Cada una devuelve [{ id, nombre }] en orden alfabético.
import { pedir } from './api';

// Al abrir el registro → GET /api/ubicacion/paises
export const listarPaises = () => pedir('/ubicacion/paises');

// Al elegir un país → GET /api/ubicacion/provincias?pais=1
export const listarProvincias = (paisId) => pedir(`/ubicacion/provincias?pais=${paisId}`);

// Al elegir una provincia → GET /api/ubicacion/cantones?provincia=1
export const listarCantones = (provinciaId) => pedir(`/ubicacion/cantones?provincia=${provinciaId}`);

// Al elegir un cantón → GET /api/ubicacion/distritos?canton=1
export const listarDistritos = (cantonId) => pedir(`/ubicacion/distritos?canton=${cantonId}`);
