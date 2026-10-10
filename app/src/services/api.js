// =====================================================================
// Conexión con la API · el ÚNICO archivo de la app que usa fetch.
// Los demás servicios (informacion.js, menu.js...) llaman a pedir().
// Así, la dirección de la API y el manejo de errores están en un solo lugar.
// =====================================================================
import { API_URL } from '../config/config';

// Hace un GET a la ruta indicada y devuelve el JSON de la respuesta.
// Ej.: pedir('/menu') → GET http://<computadora>:3000/api/menu
// Si la API responde con error (códigos 400, 404, 500...), lanza un Error
// con el mensaje de la API, para que la pantalla lo muestre.
export async function pedir(ruta) {
  const respuesta = await fetch(`${API_URL}${ruta}`);
  const datos = await respuesta.json();
  // respuesta.ok es true con los códigos 200-299.
  if (!respuesta.ok) throw new Error(datos.mensaje || 'No se pudo cargar la información');
  return datos;
}
