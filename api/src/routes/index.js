// CAPA API: aquí se definen los endpoints y qué controlador los atiende.
const { Router } = require('express');
const saludController = require('../controllers/salud.controller');

// Router agrupa rutas. En app.js se monta en '/api', por eso
// Método GET + ruta '/salud' → función verificar del controlador.
// POST/PUT/PATCH/DELETE se definen igual: router.post('/pedidos', ...).
// router.get('/salud') queda como GET /api/salud.
const router = Router();

router.get('/salud', saludController.verificar);

// Módulo Información (Inicio): /api/restaurante, /api/horario, /api/promociones
router.use(require('./informacion.routes'));

// Módulo Menú: /api/menu
router.use('/menu', require('./menu.routes'));

// Próximos módulos (se agregan día a día):
// router.use('/auth', require('./auth.routes'));
// router.use('/pedidos', require('./pedidos.routes'));
// router.use('/reservas', require('./reservas.routes'));
// router.use('/eventos', require('./eventos.routes'));

module.exports = router;
