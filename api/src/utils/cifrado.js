// =====================================================================
// Protección de datos sensibles (HU-23). Usa el módulo crypto que ya
// viene con Node (no hay que instalar nada).
//
// Tres herramientas distintas, cada una para un caso:
//
//   1. CIFRAR / DESCIFRAR (AES-256-GCM) → datos que hay que volver a leer:
//      cédula, teléfono y la clave de Google Authenticator.
//      Llave: CLAVE_CIFRADO del .env. Sin la llave no se pueden leer.
//
//   2. HASH CON LLAVE (HMAC-SHA256) → hashCedula().
//      El cifrado AES usa un valor al azar (IV): la misma cédula cifrada
//      dos veces da dos textos distintos, así la base no puede saber si
//      está repetida. El hash siempre da lo mismo para la misma cédula,
//      y la base lo guarda en cedula_hash con UNIQUE.
//      "Cifrado para leer, hash para buscar."
//      Lleva llave (CLAVE_HASH_CEDULA) para que nadie pueda calcular el
//      hash de todas las cédulas posibles y adivinar cuál es cuál.
//
//   3. HASH SIN LLAVE (SHA-256) → hashCodigo().
//      Para el link de verificación y el código de 6 dígitos: la base
//      guarda el hash, nunca el código. Como vencen rápido y son de un
//      solo uso, no necesitan bcrypt.
//
// (Las contraseñas y las respuestas de seguridad usan bcrypt, en los
// servicios: es lento a propósito, para que adivinar cueste mucho.)
// =====================================================================
const crypto = require('crypto');

const ALGORITMO = 'aes-256-gcm';

// Lee una llave del .env: 64 caracteres hexadecimales = 32 bytes.
// Si falta o está mal, avisa con un mensaje claro.
function leerLlave(nombre) {
  const valor = process.env[nombre] || '';
  if (!/^[0-9a-fA-F]{64}$/.test(valor)) {
    throw new Error(`Falta ${nombre} en el .env (64 caracteres hexadecimales). ` +
      'Genérela con: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  }
  return Buffer.from(valor, 'hex');
}

// '115230456' → 'iv:etiqueta:cifrado' (todo en hexadecimal).
//   · iv: 12 bytes al azar, distintos cada vez
//   · etiqueta (auth tag): permite detectar si alguien alteró el texto
function cifrar(texto) {
  if (texto == null) return null;
  const iv = crypto.randomBytes(12);
  const cifrador = crypto.createCipheriv(ALGORITMO, leerLlave('CLAVE_CIFRADO'), iv);
  const cifrado = Buffer.concat([cifrador.update(String(texto), 'utf8'), cifrador.final()]);
  const etiqueta = cifrador.getAuthTag();
  return `${iv.toString('hex')}:${etiqueta.toString('hex')}:${cifrado.toString('hex')}`;
}

// 'iv:etiqueta:cifrado' → '115230456'. Si alguien cambió el texto en la
// base, la etiqueta no coincide y final() lanza un error.
function descifrar(textoCifrado) {
  if (!textoCifrado) return null;
  const [iv, etiqueta, cifrado] = textoCifrado.split(':').map((parte) => Buffer.from(parte, 'hex'));
  const descifrador = crypto.createDecipheriv(ALGORITMO, leerLlave('CLAVE_CIFRADO'), iv);
  descifrador.setAuthTag(etiqueta);
  return Buffer.concat([descifrador.update(cifrado), descifrador.final()]).toString('utf8');
}

// Hash de la cédula para cedula_hash (64 caracteres hexadecimales).
function hashCedula(cedula) {
  return crypto.createHmac('sha256', leerLlave('CLAVE_HASH_CEDULA')).update(String(cedula)).digest('hex');
}

// Hash del link de verificación o del código de 6 dígitos.
function hashCodigo(codigo) {
  return crypto.createHash('sha256').update(String(codigo)).digest('hex');
}

// Código de 6 dígitos al azar ('048213'). randomInt es seguro para esto
// (Math.random no lo es).
function generarCodigo() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
}

// Texto al azar para el link del correo (64 caracteres hexadecimales).
function generarTokenLink() {
  return crypto.randomBytes(32).toString('hex');
}

module.exports = { cifrar, descifrar, hashCedula, hashCodigo, generarCodigo, generarTokenLink };
