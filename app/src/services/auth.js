// Servicios del módulo Cuenta (HU-01, HU-02, HU-14, HU-20, HU-21).
// Cada función llama a pedir() de api.js con su ruta de la API.
// La contraseña se protege en la API (bcrypt); la app nunca la guarda.
//
// El login del cliente es en 2 pasos (HU-21). Entre un paso y otro la API
// entrega un "pase": un token temporal (10 minutos) que solo sirve para el
// paso siguiente. La pantalla lo guarda en su estado y lo manda como token.
import { pedir } from './api';

// HU-01 · Preguntas de seguridad para elegir 3 → GET /api/auth/preguntas
// Devuelve [{ id, texto }]
export const obtenerPreguntas = () => pedir('/auth/preguntas');

// HU-01 · Crear cuenta → POST /api/auth/registro
// datos = { nombre_completo, cedula, telefono, correo, contrasena, confirmacion,
//           respuestas: [{ pregunta_id, respuesta }, ×3] }
// Devuelve { correo, mensaje }. NO inicia sesión: primero hay que
// confirmar el correo con el link que envía la API.
export const registrar = (datos) => pedir('/auth/registro', { metodo: 'POST', cuerpo: datos });

// HU-01 · Reenviar el correo de verificación → POST /api/auth/reenviar-verificacion
export const reenviarVerificacion = (correo) =>
  pedir('/auth/reenviar-verificacion', { metodo: 'POST', cuerpo: { correo } });

// HU-02 / HU-14 · Paso 1: correo y contraseña → POST /api/auth/login
// Devuelve { paso: 'DOBLE_FACTOR', pase, metodos: ['CORREO', 'AUTENTICADOR'?] } (cliente)
//       o  { paso: 'LISTO', usuario, token } (administrador)
// Errores: 401 datos incorrectos · 423 bloqueada (error.datos.segundos)
//          403 sin verificar el correo (error.datos.pendiente)
export const login = (correo, contrasena) =>
  pedir('/auth/login', { metodo: 'POST', cuerpo: { correo, contrasena } });

// HU-21 · Enviar el código de 6 dígitos al correo → POST /api/auth/login/enviar-codigo
// Devuelve { mensaje, segundos } (el código vence en 2 minutos)
export const enviarCodigo = (pase) =>
  pedir('/auth/login/enviar-codigo', { metodo: 'POST', token: pase });

// HU-21 · Paso 2: el código → POST /api/auth/login/verificar
// metodo = 'CORREO' | 'AUTENTICADOR'
// Devuelve { paso: 'LISTO', usuario, token }
//       o  { paso: 'CAMBIAR_CONTRASENA', pase } si la contraseña venció (HU-20)
export const verificarCodigo = (pase, metodo, codigo) =>
  pedir('/auth/login/verificar', { metodo: 'POST', cuerpo: { metodo, codigo }, token: pase });

// HU-20 · Contraseña vencida (90 días) → POST /api/auth/login/cambiar-contrasena
// Devuelve { paso: 'LISTO', usuario, token }
export const cambiarContrasenaVencida = (pase, contrasena, confirmacion) =>
  pedir('/auth/login/cambiar-contrasena', {
    metodo: 'POST',
    cuerpo: { contrasena, confirmacion },
    token: pase,
  });
