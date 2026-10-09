// CAPA LÓGICA DE NEGOCIO (servicio) del módulo Información (HU-04, 05, 06).
// Decide qué datos salen hacia la app y en qué formato.
const informacionRepository = require('../repositories/informacion.repository');
const { ahora, diaSemanaIso, formatearHora, formatearFecha, estadoDelLocal } = require('../utils/tiempo');

// HU-04 · Horario de la semana + indicador "Abierto ahora" / "Cerrado".
async function obtenerHorario() {
  const filas = await informacionRepository.obtenerHorario();

  // MySQL devuelve los BOOLEAN como 1 o 0. Se pasan a true/false.
  const horario = filas.map((fila) => ({
    ...fila,
    abierto: Boolean(fila.abierto),
    cierra_dia_siguiente: Boolean(fila.cierra_dia_siguiente),
  }));

  // Se toma la hora una sola vez para que "hoy" y el estado coincidan.
  const momento = ahora();
  const hoy = diaSemanaIso(momento);

  return {
    // La regla de "abierto o cerrado" vive en utils/tiempo.js
    estado: estadoDelLocal(horario, momento),
    // Lista lista para mostrar: la app no tiene que formatear horas.
    dias: horario.map((d) => ({
      id: d.dia_semana_id,
      dia: d.dia,
      horas: d.abierto ? `${formatearHora(d.hora_apertura)} – ${formatearHora(d.hora_cierre)}` : 'Cerrado',
      esHoy: d.dia_semana_id === hoy,
    })),
  };
}

// HU-05 · Ubicación y contacto.
async function obtenerRestaurante() {
  const restaurante = await informacionRepository.obtenerRestaurante();

  // Si la tabla está vacía (no se ejecutó 03_datos_iniciales.sql), se lanza
  // un error con status 404. El middleware de errores lo convierte en
  // { mensaje: '...' } para la app.
  if (!restaurante) {
    const error = new Error('No hay datos del restaurante');
    error.status = 404;
    throw error;
  }

  // Solo se envía lo que muestra la pantalla. Por decisión del proyecto se
  // muestra un único número (teléfono); la columna whatsapp existe en la
  // base pero no se envía.
  return {
    nombre: restaurante.nombre,
    direccion: restaurante.direccion,
    senas: restaurante.senas,
    telefono: restaurante.telefono,
  };
}

// HU-06 · Promociones vigentes. Si no hay, devuelve [] y la app muestra
// "No hay promociones por el momento".
async function listarPromociones() {
  const filas = await informacionRepository.listarPromocionesVigentes();

  return filas.map((p) => ({
    id: p.id,
    titulo: p.titulo,
    descripcion: p.descripcion,
    // 'Jueves, Viernes' → ['Jueves', 'Viernes'] (cada día es una etiqueta)
    dias: p.dias_validos ? p.dias_validos.split(', ') : [],
    // '2026-10-31' → '31 oct 2026'
    vence: formatearFecha(p.fecha_fin),
  }));
}

module.exports = { obtenerHorario, obtenerRestaurante, listarPromociones };
