// Servicios del módulo Perfil (HU-02, HU-20, HU-21).
// Todas piden el token de la sesión: la API sabe quién es por él.
import { pedir } from './api';

// Perfil completo → GET /api/perfil
// Devuelve { id, rol, nombre_completo, cedula, telefono, correo, authenticator_activo }
// La cédula y el teléfono están cifrados en la base; la API los descifra (HU-23).
export const obtenerPerfil = (token) => pedir('/perfil', { token });

// HU-20 · Cambiar la contraseña → PUT /api/perfil/contrasena
export const cambiarContrasena = (token, actual, contrasena, confirmacion) =>
  pedir('/perfil/contrasena', { metodo: 'PUT', cuerpo: { actual, contrasena, confirmacion }, token });

// HU-21 · Vincular Google Authenticator, paso 1 → POST /api/perfil/autenticador
// Devuelve { clave, clave_formateada, cuenta, emisor }
export const iniciarVinculacion = (token) =>
  pedir('/perfil/autenticador', { metodo: 'POST', token });

// HU-21 · Vincular, paso 2: el primer código de la app → POST /api/perfil/autenticador/confirmar
export const confirmarVinculacion = (token, codigo) =>
  pedir('/perfil/autenticador/confirmar', { metodo: 'POST', cuerpo: { codigo }, token });

// HU-21 · Desvincular (pide un código actual) → DELETE /api/perfil/autenticador
export const desvincularAutenticador = (token, codigo) =>
  pedir('/perfil/autenticador', { metodo: 'DELETE', cuerpo: { codigo }, token });
