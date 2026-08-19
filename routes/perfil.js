const express = require('express');
const router = express.Router();
const perfilController = require('../controllers/perfilController');

router.get('/', perfilController.mostrar);
router.post('/actualizar', perfilController.actualizarDatos);
router.post('/password', perfilController.cambiarPassword);

module.exports = router;