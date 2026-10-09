// Llamadas a la API del módulo Información (pantalla Inicio).
// Las pantallas y componentes NO usan fetch directamente: llaman a estas
// funciones. Así, si cambia la dirección de la API, solo se toca config.js.
import { API_URL } from '../config/config';

// Función de apoyo: hace el GET a la ruta indicada y devuelve el JSON.
// Si la API responde con error, lanza un Error con el mensaje de la API.
async function pedir(ruta) {
  const respuesta = await fetch(`${API_URL}${ruta}`);
  const datos = await respuesta.json();
  // respuesta.ok es true con los códigos 200-299.
  if (!respuesta.ok) throw new Error(datos.mensaje || 'No se pudo cargar la información');
  return datos;
}

// HU-04 · Horario → GET /api/horario
// Devuelve [{ id, dia, horas, esHoy }] (los 7 días)
export function obtenerHorario() {
  return pedir('/horario');
}

// HU-05 · Ubicación y contacto → GET /api/restaurante
// Devuelve { nombre, direccion, senas, telefono }
export function obtenerRestaurante() {
  return pedir('/restaurante');
}

// HU-06 · Promociones → GET /api/promociones
// Devuelve [{ id, titulo, descripcion }] (puede venir vacía)
export function listarPromociones() {
  return pedir('/promociones');
}
