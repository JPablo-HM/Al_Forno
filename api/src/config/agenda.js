// =====================================================================
// Agenda de actividades (quemada en la API) · HU-12
//
// La agenda es solo INFORMATIVA y fija: no se compran ni se pagan
// entradas y el administrador no la edita. Por eso NO está en la base de
// datos. Si cambia una actividad, se cambia aquí.
//
// Cada actividad:
//   · id:          número único (lo usa la app como key de la lista)
//   · dias:        los días en que se repite, escritos como se muestran
//   · nombre:      lo que se muestra como título
//   · descripcion: texto corto para el cliente
// El orden de la lista es el orden en que se muestra (de martes a domingo).
// =====================================================================
const AGENDA = [
  {
    id: 1,
    dias: 'Martes y miércoles',
    nombre: 'Noche de karaoke',
    descripcion: 'Elegí tu canción favorita y subí al escenario.',
  },
  {
    id: 2,
    dias: 'Jueves',
    nombre: 'DJ en vivo',
    descripcion: 'La mejor música para empezar el fin de semana.',
  },
  {
    id: 3,
    dias: 'Viernes y sábado',
    nombre: 'Música en vivo',
    descripcion: 'Bandas y artistas en vivo para acompañar tu cena.',
  },
  {
    id: 4,
    dias: 'Domingo',
    nombre: 'Noche de karaoke',
    descripcion: 'Cerrá la semana cantando con tus amigos.',
  },
];

module.exports = { AGENDA };
