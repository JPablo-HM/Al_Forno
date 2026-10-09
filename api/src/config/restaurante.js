// =====================================================================
// Datos fijos del restaurante (quemados en la API)
//
// No están en la base de datos porque la app no los edita (ver "Fuera de
// alcance" en las historias de usuario). Si cambian, se cambian aquí.
// Los usan:
//   · Inicio (HU-04 Horario y HU-05 Ubicación)
//   · Pedidos (HU-07: hasta 30 minutos antes del cierre)
//   · Reservas (HU-10: horas disponibles según el horario)
// =====================================================================

// HU-05 · Ubicación y contacto
// ⚠ Dirección, señas y teléfono son de ejemplo: reemplazar por los reales.
const RESTAURANTE = {
  nombre: 'AL FORNO',
  direccion: 'Cartago, Costa Rica',
  senas: 'Señas pendientes: completar con la dirección exacta del local.',
  telefono: '00000000', // 8 dígitos, sin guion
};

// HU-04 · Horario de atención (Reglas generales de las historias de usuario)
// id: día de la semana, 1 = lunes … 7 = domingo.
// Horas en formato 24 h ('17:00' = 5:00 p.m.).
// cierraDiaSiguiente: true cuando el cierre pasa de la medianoche
// (viernes y sábado cierran a la 1:00 a.m. del día siguiente). Inicio no
// lo usa (solo muestra el horario); lo usarán Pedidos y Reservas.
const HORARIO = [
  { id: 1, dia: 'Lunes',     abierto: false },
  { id: 2, dia: 'Martes',    abierto: true, apertura: '17:00', cierre: '23:00', cierraDiaSiguiente: false },
  { id: 3, dia: 'Miércoles', abierto: true, apertura: '17:00', cierre: '23:00', cierraDiaSiguiente: false },
  { id: 4, dia: 'Jueves',    abierto: true, apertura: '17:00', cierre: '23:00', cierraDiaSiguiente: false },
  { id: 5, dia: 'Viernes',   abierto: true, apertura: '17:00', cierre: '01:00', cierraDiaSiguiente: true },
  { id: 6, dia: 'Sábado',    abierto: true, apertura: '17:00', cierre: '01:00', cierraDiaSiguiente: true },
  { id: 7, dia: 'Domingo',   abierto: true, apertura: '12:00', cierre: '21:00', cierraDiaSiguiente: false },
];

module.exports = { RESTAURANTE, HORARIO };
