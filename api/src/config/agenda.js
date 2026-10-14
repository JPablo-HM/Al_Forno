// =====================================================================
// Agenda de actividades (quemada en la API) · HU-12
//
// Por ahora la agenda es solo INFORMATIVA: no se compran ni se pagan
// entradas. Por eso no se lee de la base de datos (la tabla agenda y
// sus procedimientos quedan sin usarse por el momento). Si cambia una
// actividad, se cambia aquí.
//
// Cada actividad:
//   · id:          número único (lo usa la app como key de la lista)
//   · dias:        días de la semana en que se repite, 1 = lunes … 7 = domingo
//                  (la misma numeración que HORARIO en config/restaurante.js)
//   · nombre:      lo que se muestra como título
//   · descripcion: texto corto para el cliente
// El orden de la lista es el orden en que se muestra (de martes a domingo).
// =====================================================================
const AGENDA = [
  {
    id: 1,
    dias: [2, 3], // martes y miércoles
    nombre: 'Noche de karaoke',
    descripcion: 'Elegí tu canción favorita y subí al escenario.',
  },
  {
    id: 2,
    dias: [4], // jueves
    nombre: 'DJ en vivo',
    descripcion: 'La mejor música para empezar el fin de semana.',
  },
  {
    id: 3,
    dias: [5, 6], // viernes y sábado
    nombre: 'Música en vivo',
    descripcion: 'Bandas y artistas en vivo para acompañar tu cena.',
  },
  {
    id: 4,
    dias: [7], // domingo
    nombre: 'Noche de karaoke',
    descripcion: 'Cerrá la semana cantando con tus amigos.',
  },
];

module.exports = { AGENDA };
