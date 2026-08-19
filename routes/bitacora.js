const express = require('express');
const router = express.Router();
const bitacoraController = require('../controllers/bitacoraController');
const protegerRuta = require('../middleware/auth'); // Seguridad

// Proteger ruta (solo administradores deberían ver esto idealmente)
router.use(protegerRuta);

// Ruta principal: /auditoria o /bitacora
router.get('/', bitacoraController.mostrar);

module.exports = router;