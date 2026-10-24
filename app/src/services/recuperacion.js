// Servicios del módulo Recuperar contraseña (HU-22).
// Son 3 pasos; cada uno entrega un "pase" (token temporal) para el siguiente.
import { pedir } from './api';

// Paso 1 · El correo → POST /api/recuperacion/inicio
// Devuelve { pase, metodos: ['PREGUNTAS', 'AUTENTICADOR'?],
//            preguntas: [{ pregunta_id, texto }] } (las 3 del cliente)
export const iniciarRecuperacion = (correo) =>
  pedir('/recuperacion/inicio', { metodo: 'POST', cuerpo: { correo } });

// Paso 2 · Comprobar que es el dueño → POST /api/recuperacion/verificar
// datos = { metodo: 'PREGUNTAS', respuestas: [{ pregunta_id, respuesta }, ×3] }
//      o  { metodo: 'AUTENTICADOR', codigo }
// Devuelve { pase } para el paso 3.
export const verificarIdentidad = (pase, datos) =>
  pedir('/recuperacion/verificar', { metodo: 'POST', cuerpo: datos, token: pase });

// Paso 3 · La contraseña nueva → POST /api/recuperacion/nueva
// Devuelve { mensaje }. La API avisa por correo del cambio.
export const guardarNuevaContrasena = (pase, contrasena, confirmacion) =>
  pedir('/recuperacion/nueva', { metodo: 'POST', cuerpo: { contrasena, confirmacion }, token: pase });
