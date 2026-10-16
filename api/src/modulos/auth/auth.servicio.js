// CAPA LÓGICA DE NEGOCIO (servicio) del módulo Cuenta (HU-01, HU-02, HU-14).
// Aquí se cifra la contraseña (bcrypt) y se crea el token de sesión (JWT).
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authRepositorio = require('./auth.repositorio');

const RONDAS_BCRYPT = 10; // cuántas veces se mezcla la contraseña: más = más lento de adivinar

// Crea el token con lo mínimo para saber quién es: id y rol.
// Va firmado con JWT_SECRET: si alguien lo cambia, la firma ya no coincide.
function crearToken(usuario) {
  return jwt.sign({ id: usuario.id, rol: usuario.rol }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });
}

// Lo que la app recibe del usuario: nunca la contraseña ni el hash.
function datosPublicos(u) {
  return { id: u.id, rol: u.rol, nombre_completo: u.nombre_completo, correo: u.correo };
}

// HU-01 · Registro. La contraseña se guarda CIFRADA (nunca el texto).
// Al terminar, el cliente queda con la sesión iniciada: se devuelve el token.
async function registrar(datos) {
  const hash = await bcrypt.hash(datos.contrasena, RONDAS_BCRYPT);
  const usuario = await authRepositorio.registrarUsuario(datos, hash);
  return { usuario: datosPublicos(usuario), token: crearToken(usuario) };
}

// HU-02 / HU-14 · Iniciar sesión (clientes y administrador).
// Si el correo no existe o la contraseña no coincide, el mensaje es el MISMO
// para no revelar cuál de los dos falló (criterio de HU-02).
async function iniciarSesion(correo, contrasena) {
  const usuario = await authRepositorio.obtenerUsuarioPorCorreo(correo);
  // bcrypt.compare cifra la contraseña escrita y la compara con el hash guardado.
  const coincide = usuario && (await bcrypt.compare(contrasena, usuario.contrasena_hash));

  if (!coincide) {
    const error = new Error('Correo o contraseña incorrectos');
    error.status = 401;
    throw error;
  }
  return { usuario: datosPublicos(usuario), token: crearToken(usuario) };
}

// HU-02 · Perfil completo (con cédula y teléfono). El id sale del token.
async function obtenerPerfil(id) {
  const usuario = await authRepositorio.obtenerUsuario(id);
  if (!usuario) {
    const error = new Error('El usuario no existe');
    error.status = 404;
    throw error;
  }
  return usuario;
}

module.exports = { registrar, iniciarSesion, obtenerPerfil };
