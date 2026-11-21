// CAPA LÓGICA DE NEGOCIO (servicio) del módulo Tipo de cambio.
//
// Consulta el tipo de cambio oficial del dólar al Banco Central de Costa
// Rica (BCCR), un servicio web real que pide un token (BCCR_TOKEN en .env).
// Este módulo NO tiene repositorio: no usa la base de datos de Al Forno.
//
//   Código 317 = Tipo cambio compra   ·   Código 318 = Tipo cambio venta
//
// El BCCR se consulta UNA vez al día: el resultado se guarda en memoria
// (variable "ultimo"). Si el BCCR no responde, se devuelve el último
// valor que se tenga.
const { errorCon } = require('../../utils/errores');
const { ahora } = require('../../utils/tiempo');

const URL_BCCR =
  'https://apim.bccr.fi.cr/SDDE/api/Bccr.GE.SDDE.Publico.Indicadores.API/indicadoresEconomicos';

// Último tipo de cambio obtenido: { compra, venta, fecha, consultado }
// "consultado" es el día (YYYY-MM-DD) en que se le pidió al BCCR.
let ultimo = null;

// Pide un indicador al BCCR y devuelve su dato más reciente: { fecha, valor }.
// Se piden los últimos 7 días y se toma el último de la lista.
async function consultarIndicador(codigo) {
  const fin = ahora();
  const inicio = fin.subtract(7, 'day');
  const url =
    `${URL_BCCR}/${codigo}/series` +
    `?fechaInicio=${encodeURIComponent(inicio.format('YYYY/MM/DD'))}` +
    `&fechaFin=${encodeURIComponent(fin.format('YYYY/MM/DD'))}&idioma=ES`;

  const respuesta = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.BCCR_TOKEN}` },
    signal: AbortSignal.timeout(10000), // si en 10 s no contesta, se cancela
  });
  if (!respuesta.ok) throw new Error(`El BCCR respondió ${respuesta.status}`);

  // Forma de la respuesta:
  // { estado, mensaje, datos: [{ series: [{ fecha: '2026-11-21', valorDatoPorPeriodo: 446.17 }] }] }
  const cuerpo = await respuesta.json();
  const serie = cuerpo.datos[0].series;
  const dato = serie[serie.length - 1];
  return { fecha: dato.fecha, valor: dato.valorDatoPorPeriodo };
}

// Devuelve { compra, venta, fecha }.
async function obtenerTipoCambio() {
  const hoy = ahora().format('YYYY-MM-DD');

  // Ya se consultó hoy: no se vuelve a llamar al BCCR
  if (ultimo && ultimo.consultado === hoy) {
    return { compra: ultimo.compra, venta: ultimo.venta, fecha: ultimo.fecha };
  }

  try {
    const [compra, venta] = await Promise.all([consultarIndicador(317), consultarIndicador(318)]);
    ultimo = { compra: compra.valor, venta: venta.valor, fecha: venta.fecha, consultado: hoy };
  } catch (error) {
    // El BCCR falló: se usa el último valor guardado, si hay
    console.error('Tipo de cambio BCCR:', error.message);
    if (!ultimo) throw errorCon(503, 'Tipo de cambio no disponible en este momento');
  }
  return { compra: ultimo.compra, venta: ultimo.venta, fecha: ultimo.fecha };
}

module.exports = { obtenerTipoCambio };
