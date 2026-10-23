// =====================================================================
// Reglas de seguridad de la cuenta (HU-01, HU-02, HU-20 a HU-24).
// Todas las reglas están AQUÍ, en un solo lugar: si el profesor pide
// cambiar un número (por ejemplo, 5 intentos en vez de 3), se cambia
// solo en este archivo.
// =====================================================================

// HU-02 · Bloqueo por intentos fallidos
const MAX_INTENTOS = 3;          // al tercer fallo seguido se bloquea
const MINUTOS_BLOQUEO = 1;       // durante 1 minuto

// HU-20 · Política de contraseñas
const DIAS_VIGENCIA = 90;        // la contraseña vence a los 90 días
const HISTORIAL_CONTRASENAS = 5; // no se puede repetir ninguna de las últimas 5
// Cada regla tiene su texto: la app muestra la misma lista con ✓.
const POLITICA_CONTRASENA = [
  { regla: /^.{8,}$/,         texto: 'Al menos 8 caracteres' },
  { regla: /[A-Z]/,           texto: 'Una letra mayúscula' },
  { regla: /[a-z]/,           texto: 'Una letra minúscula' },
  { regla: /\d/,              texto: 'Un número' },
  { regla: /[^A-Za-z0-9\s]/,  texto: 'Un símbolo (por ejemplo ! @ # $ %)' },
];
const LARGO_MAXIMO_CONTRASENA = 64; // bcrypt solo usa los primeros 72 bytes

// HU-01 · Link de verificación del correo ("¿Eres vos?")
const MINUTOS_LINK_VERIFICACION = 24 * 60;  // 24 horas

// HU-21 · Doble factor
const MINUTOS_CODIGO_CORREO = 2;  // el código de 6 dígitos vence en 2 minutos
// Google Authenticator cambia el código cada 30 s. Se acepta también el
// código anterior y el siguiente (±30 s) por si el reloj del celular
// está un poco adelantado o atrasado.
const TOLERANCIA_AUTENTICADOR_SEG = 30;
const EMISOR_AUTENTICADOR = 'AL FORNO';    // nombre que se ve en la app

// Pase temporal: token que solo sirve para el paso siguiente (código,
// contraseña vencida o recuperación). NO es una sesión.
const MINUTOS_PASE = 10;

// Límite de peticiones a las rutas de cuenta (express-rate-limit):
// máximo 50 envíos (POST) cada 15 minutos desde la misma IP.
const LIMITE_PETICIONES = { minutos: 15, maximo: 50 };

// Devuelve los textos de las reglas que la contraseña NO cumple ([] = cumple todas).
function reglasIncumplidas(contrasena = '') {
  return POLITICA_CONTRASENA.filter((p) => !p.regla.test(contrasena)).map((p) => p.texto);
}

module.exports = {
  MAX_INTENTOS,
  MINUTOS_BLOQUEO,
  DIAS_VIGENCIA,
  HISTORIAL_CONTRASENAS,
  POLITICA_CONTRASENA,
  LARGO_MAXIMO_CONTRASENA,
  MINUTOS_LINK_VERIFICACION,
  MINUTOS_CODIGO_CORREO,
  TOLERANCIA_AUTENTICADOR_SEG,
  EMISOR_AUTENTICADOR,
  MINUTOS_PASE,
  LIMITE_PETICIONES,
  reglasIncumplidas,
};
