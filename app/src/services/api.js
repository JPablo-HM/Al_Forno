// =====================================================================
// Conexión con la API · el ÚNICO archivo de la app que usa fetch.
// Los demás servicios (informacion.js, menu.js, auth.js...) llaman a pedir().
// Así, la dirección de la API y el manejo de errores están en un solo lugar.
// =====================================================================
import { API_URL } from '../config/config';

// Hace una petición a la API y devuelve el JSON de la respuesta.
//
//   pedir('/menu')                                        → GET
//   pedir('/auth/login', { metodo: 'POST', cuerpo: {...} }) → POST con datos
//   pedir('/auth/perfil', { token })                       → GET con sesión
//
// Opciones (todas opcionales):
//   metodo → 'GET' (por defecto), 'POST', 'PUT' o 'DELETE'
//   cuerpo → objeto con los datos a enviar; se convierte a JSON
//   token  → token de la sesión; viaja en el encabezado Authorization
//
// Si la API responde con error (400, 401, 409, 500...), lanza un Error con
// el mensaje de la API para que la pantalla lo muestre. Si el error es de
// un campo del formulario, error.campo dice cuál (ej. 'cedula').
export async function pedir(ruta, { metodo = 'GET', cuerpo, token } = {}) {
  const encabezados = {};
  if (cuerpo) encabezados['Content-Type'] = 'application/json';
  if (token) encabezados.Authorization = `Bearer ${token}`;

  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      method: metodo,
      headers: encabezados,
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    });
  } catch {
    // fetch falla así cuando no hay red o la API está apagada.
    throw new Error('No se pudo conectar con el servidor');
  }

  // Si la respuesta no trae JSON, se usa un objeto vacío.
  const datos = await respuesta.json().catch(() => ({}));

  // respuesta.ok es true con los códigos 200-299.
  if (!respuesta.ok) {
    const error = new Error(datos.mensaje || 'No se pudo completar la acción');
    error.campo = datos.campo;
    error.status = respuesta.status;
    throw error;
  }
  return datos;
}
