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

const router = Router();

// Módulo Salud: GET /api/salud (comprueba que la API y MySQL responden)
router.use(require('./salud/salud.rutas'));

// Módulo Información (pantalla Inicio): GET /api/horario, /api/restaurante, /api/promociones
router.use(require('./informacion/informacion.rutas'));

// Módulo Menú: GET /api/menu
router.use('/menu', require('./menu/menu.rutas'));

// Próximos módulos (se agregan igual, cada uno en su carpeta):
// router.use('/auth', require('./auth/auth.rutas'));
// router.use('/pedidos', require('./pedidos/pedidos.rutas'));
// router.use('/reservas', require('./reservas/reservas.rutas'));
// router.use('/agenda', require('./agenda/agenda.rutas'));

module.exports = router;
