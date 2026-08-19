const express = require('express');
const router = express.Router();
const empenosController = require('../controllers/empenosController');
const protegerRuta = require('../middleware/auth');
const upload = require('../middleware/upload'); // <--- Necesario para la foto del artículo

// Seguridad: Proteger todas las rutas
router.use(protegerRuta);

// 1. Listar Empeños
router.get('/', empenosController.listar);

// (La creación de empeños ahora se hace exclusivamente desde Préstamos)

// 4. Liberar/Devolver Artículo
router.get('/liberar/:id', empenosController.liberar);

module.exports = router;