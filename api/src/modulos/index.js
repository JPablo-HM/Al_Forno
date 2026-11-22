// =====================================================================
// REGISTRO DE MÓDULOS · Aquí se conectan todas las rutas de la API.
// En app.js todo esto se monta en '/api'.
//
// Cada módulo vive en su propia carpeta con 3 archivos, uno por capa:
//   · <modulo>.rutas.js       CAPA API: endpoints; recibe la petición y responde
//   · <modulo>.servicio.js    CAPA LÓGICA DE NEGOCIO: reglas del negocio
//   · <modulo>.repositorio.js CAPA ACCESO A DATOS: llama los procedimientos de MySQL
// =====================================================================
const { Router } = require('express');
const { rateLimit } = require('express-rate-limit');
const { LIMITE_PETICIONES } = require('../config/seguridad');

const router = Router();

// Límite de peticiones para las rutas de cuenta (registro, login,
// recuperación): máximo 50 envíos (POST) cada 15 minutos desde la misma
// IP. Es una capa más contra quien intente adivinar contraseñas o
// códigos, aparte del bloqueo de 1 minuto por cuenta (HU-02).
// Las consultas (GET: preguntas de seguridad, link del correo) no cuentan.
const limiteCuenta = rateLimit({
  windowMs: LIMITE_PETICIONES.minutos * 60 * 1000,
  limit: LIMITE_PETICIONES.maximo,
  skip: (req) => req.method === 'GET',
  message: { mensaje: 'Demasiadas solicitudes. Espera unos minutos e intenta de nuevo' },
});

// Módulo Salud: GET /api/salud (comprueba que la API y MySQL responden)
router.use(require('./salud/salud.rutas'));

// Módulo Información (pantalla Inicio): GET /api/horario, /api/restaurante, /api/promociones,
// /api/novedades (socio Cervecería)
router.use(require('./informacion/informacion.rutas'));

// Módulo Cuenta (HU-01, HU-02, HU-20, HU-21): GET /api/auth/preguntas,
// POST /api/auth/registro, GET /api/auth/verificar, POST /api/auth/reenviar-verificacion,
// POST /api/auth/login, POST /api/auth/login/enviar-codigo, POST /api/auth/login/verificar,
// POST /api/auth/login/cambiar-contrasena
router.use('/auth', limiteCuenta, require('./auth/auth.rutas'));

// Módulo Recuperación (HU-22): POST /api/recuperacion/inicio, /verificar, /nueva
router.use('/recuperacion', limiteCuenta, require('./recuperacion/recuperacion.rutas'));

// Módulo Ubicación (HU-01, cajas del registro): GET /api/ubicacion/paises,
// GET /api/ubicacion/provincias?pais=, GET /api/ubicacion/cantones?provincia=,
// GET /api/ubicacion/distritos?canton=
router.use('/ubicacion', require('./ubicacion/ubicacion.rutas'));

// Módulo Perfil (con sesión): GET /api/perfil, PUT /api/perfil/contrasena,
// POST /api/perfil/autenticador, POST /api/perfil/autenticador/confirmar,
// DELETE /api/perfil/autenticador
router.use('/perfil', require('./perfil/perfil.rutas'));

// Módulo Menú: GET /api/menu
router.use('/menu', require('./menu/menu.rutas'));

// Módulo Agenda: GET /api/agenda (eventos del socio Cartelera de eventos)
router.use('/agenda', require('./agenda/agenda.rutas'));

// Módulo Tipo de cambio (servicio web del BCCR): GET /api/tipo-cambio
router.use('/tipo-cambio', require('./tipo-cambio/tipo-cambio.rutas'));

// Módulo Pedidos (solo clientes con sesión): POST /api/pedidos, GET /api/pedidos, GET /api/pedidos/:id,
// POST /api/pedidos/paypal, POST /api/pedidos/paypal/confirmar
router.use('/pedidos', require('./pedidos/pedidos.rutas'));

// Módulo Reservas (solo clientes con sesión): GET /api/reservas/horas, POST /api/reservas,
// GET /api/reservas, PATCH /api/reservas/:id/cancelar
router.use('/reservas', require('./reservas/reservas.rutas'));

module.exports = router;
