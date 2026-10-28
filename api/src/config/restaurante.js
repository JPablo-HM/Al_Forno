// =====================================================================
// Datos fijos del restaurante (quemados en la API) · HU-04 y HU-05
//
// No están en la base de datos porque la app no los edita (ver "Fuera de
// alcance" en las historias de usuario). Si cambian, se cambian aquí.
// Los usa la pantalla Inicio (módulo informacion).
// =====================================================================

// HU-05 · Ubicación y contacto
// ⚠ Dirección, señas y teléfono son de ejemplo: reemplazar por los reales.
const RESTAURANTE = {
  nombre: 'AL FORNO',
  direccion: 'Cartago, Costa Rica',
  senas: 'Cartago, Los Angeles',
  telefono: '72066114', // 8 dígitos, sin guion
};

// HU-04 · Horario de atención, escrito tal como se muestra en la app.
// id: día de la semana (1 = lunes … 7 = domingo); la app lo usa como key.
// Viernes y sábado cierran a la 1:00 a.m. del día siguiente.
const HORARIO = [
  { id: 1, dia: 'Lunes',     horas: 'Cerrado' },
  { id: 2, dia: 'Martes',    horas: '5:00 p.m. – 11:00 p.m.' },
  { id: 3, dia: 'Miércoles', horas: '5:00 p.m. – 11:00 p.m.' },
  { id: 4, dia: 'Jueves',    horas: '5:00 p.m. – 11:00 p.m.' },
  { id: 5, dia: 'Viernes',   horas: '5:00 p.m. – 1:00 a.m.' },
  { id: 6, dia: 'Sábado',    horas: '5:00 p.m. – 1:00 a.m.' },
  { id: 7, dia: 'Domingo',   horas: '12:00 m.d. – 9:00 p.m.' },
];

module.exports = { RESTAURANTE, HORARIO };
