// CAPA API: aquí se definen los endpoints y qué controlador los atiende.
const { Router } = require('express');
const saludController = require('../controllers/salud.controller');

const router = Router();

router.get('/salud', saludController.verificar);

// Próximos módulos (se agregan día a día):
// router.use('/auth', require('./auth.routes'));
// router.use('/menu', require('./menu.routes'));
// router.use('/pedidos', require('./pedidos.routes'));
// router.use('/reservas', require('./reservas.routes'));
// router.use('/eventos', require('./eventos.routes'));

module.exports = router;
