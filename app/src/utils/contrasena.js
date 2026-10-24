// Política de contraseñas (HU-20).
// Son las MISMAS reglas de la API (api/src/config/seguridad.js). La app las
// usa para mostrar la lista con ✓ mientras el cliente escribe y para no
// dejarlo continuar con una contraseña débil. La API las vuelve a revisar:
// aunque alguien se salte la app, la API no acepta una contraseña débil.
export const POLITICA_CONTRASENA = [
  { regla: /^.{8,}$/,        texto: 'Al menos 8 caracteres' },
  { regla: /[A-Z]/,          texto: 'Una letra mayúscula' },
  { regla: /[a-z]/,          texto: 'Una letra minúscula' },
  { regla: /\d/,             texto: 'Un número' },
  { regla: /[^A-Za-z0-9\s]/, texto: 'Un símbolo (por ejemplo ! @ # $ %)' },
];

// true si la contraseña cumple TODAS las reglas.
// every() revisa que la condición se cumpla en cada elemento de la lista.
export function cumplePolitica(contrasena) {
  return POLITICA_CONTRASENA.every((p) => p.regla.test(contrasena));
}
