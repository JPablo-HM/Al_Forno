// Llamadas a la API del módulo Menú.
// Las pantallas y componentes NO usan fetch directamente: llaman a estas
// funciones. Así, si cambia la dirección de la API, solo se toca config.js.
import { API_URL } from '../config/config';

// HU-03 · Menú → GET /api/menu
// Devuelve [{ categoria, productos: [{ id, nombre, descripcion, precio }] }]
// Si la API responde con error, lanza un Error con el mensaje de la API.
export async function obtenerMenu() {
  const respuesta = await fetch(`${API_URL}/menu`);
  const datos = await respuesta.json();
  if (!respuesta.ok) throw new Error(datos.mensaje || 'No se pudo cargar el menú');
  return datos;
}
