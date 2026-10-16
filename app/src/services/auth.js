// Servicios del módulo Cuenta (HU-01, HU-02, HU-14).
// Cada función llama a pedir() de api.js con su ruta de la API.
// La contraseña se cifra en la API (bcrypt); la app nunca la guarda.
import { pedir } from './api';

// HU-01 · Crear cuenta → POST /api/auth/registro
// datos = { nombre_completo, cedula, telefono, correo, contrasena }
// Devuelve { usuario, token }: el cliente queda con la sesión iniciada.
export const registrar = (datos) => pedir('/auth/registro', { metodo: 'POST', cuerpo: datos });

// HU-02 / HU-14 · Iniciar sesión → POST /api/auth/login
// Devuelve { usuario: { id, rol, nombre_completo, correo }, token }
export const login = (correo, contrasena) =>
  pedir('/auth/login', { metodo: 'POST', cuerpo: { correo, contrasena } });

// HU-02 · Perfil completo → GET /api/auth/perfil (pide el token)
// Devuelve { id, rol, nombre_completo, cedula, telefono, correo }
export const obtenerPerfil = (token) => pedir('/auth/perfil', { token });
