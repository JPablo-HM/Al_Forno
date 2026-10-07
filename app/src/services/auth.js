// Autenticación TEMPORAL (cascarón).
// Dos usuarios quemados para probar la app como cliente y como administrador.
// No usa la API, ni la base de datos, ni cifra contraseñas.
//
// Cuando exista POST /api/auth/login, solo se cambia esta función:
// la pantalla de login no necesita cambios.

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
    nombre_completo: 'María Fernández',
    correo: 'cliente.alforno',
    contrasena: 'cliente123',
    rol: 'CLIENTE',
  },
];

// Devuelve el usuario (sin la contraseña) o null si los datos no coinciden.
export function login(correo, contrasena) {
  const encontrado = USUARIOS_PRUEBA.find(
    (u) => u.correo === correo.trim().toLowerCase() && u.contrasena === contrasena
  );
  if (!encontrado) return null;

  const { contrasena: _, ...usuario } = encontrado;
  return usuario;
}
