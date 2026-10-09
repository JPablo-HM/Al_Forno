// Autenticación TEMPORAL (cascarón).
// Dos usuarios quemados para probar la app como cliente y como administrador.
// No usa la API, ni la base de datos, ni cifra contraseñas.
//
// Cuando exista POST /api/auth/login, solo se cambia esta función:
// la pantalla de login no necesita cambios.

// Lista fija de usuarios. Tienen los mismos campos que devolverá la API
// (id, nombre_completo, correo, rol) para que el cambio sea transparente.
const USUARIOS_PRUEBA = [
  {
    id: 1,
    nombre_completo: 'Administrador AL FORNO',
    correo: 'admin.alforno',
    contrasena: 'admin123',
    rol: 'ADMIN',
  },
  {
    id: 2,
    nombre_completo: 'Jose Hernández',
    correo: 'cliente.alforno',
    contrasena: 'cliente123',
    rol: 'CLIENTE',
  },
];

// Devuelve el usuario (sin la contraseña) o null si los datos no coinciden.
export function login(correo, contrasena) {
  // find recorre la lista y devuelve el primer usuario que cumpla la condición
  // (o undefined). trim() quita espacios y toLowerCase() pasa a minúsculas.
  const encontrado = USUARIOS_PRUEBA.find(
    (u) => u.correo === correo.trim().toLowerCase() && u.contrasena === contrasena
  );
  if (!encontrado) return null;

  // Desestructuración: separa la contraseña (en _, se descarta) y copia el
  // resto en usuario. Así la contraseña nunca sale de este archivo.
  const { contrasena: _, ...usuario } = encontrado;
  return usuario;
}
