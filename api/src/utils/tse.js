// =====================================================================
// CLIENTE DEL "TSE SIMULADO" (HU-01)
//
// El nombre de la persona NO lo escribe el cliente: lo da el TSE Simulado
// (C# .NET, carpeta socios/tse/), un servicio aparte con su propia base
// de datos. Aquí solo se le pregunta por HTTP (fetch) y se lee su respuesta.
//
//   GET {TSE_URL}/personas/{tipo}/{numero}   tipo: cedula, dimex o pasaporte
//
// El TSE responde 200 { tipo, numero, nombre_completo } si la persona existe,
// 404 si no existe y 400 si el número no tiene el formato de ese tipo.
// =====================================================================
const { errorCon } = require('./errores');

const TSE_URL = process.env.TSE_URL || 'http://localhost:5004';

// Tipos de identificación que acepta el TSE
const TIPOS_IDENTIFICACION = ['cedula', 'dimex', 'pasaporte'];

// Devuelve { tipo, numero, nombre_completo }.
// Los errores traen campo 'identificacion' para que la app marque esa caja.
async function consultarPersona(tipo, numero) {
  let respuesta;
  try {
    respuesta = await fetch(
      `${TSE_URL}/personas/${encodeURIComponent(tipo)}/${encodeURIComponent(numero)}`,
      { signal: AbortSignal.timeout(10000) } // si en 10 s no contesta, se cancela
    );
  } catch {
    // El TSE está apagado o no responde
    throw errorCon(503, 'El TSE no responde en este momento. Intenta de nuevo más tarde.');
  }

  const cuerpo = await respuesta.json().catch(() => ({}));
  if (respuesta.status === 404) {
    throw errorCon(404, 'No encontramos esa identificación en el TSE', { campo: 'identificacion' });
  }
  if (!respuesta.ok) {
    throw errorCon(400, cuerpo.mensaje || 'Identificación inválida', { campo: 'identificacion' });
  }
  return cuerpo;
}

module.exports = { consultarPersona, TIPOS_IDENTIFICACION };
