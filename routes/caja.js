const express = require('express');
const router = express.Router();
const cajaController = require('../controllers/cajaController');
const protegerRuta = require('../middleware/auth');

// Ver reporte en pantalla
router.get('/', protegerRuta, cajaController.mostrarReporte);

// (NUEVO) Imprimir PDF
router.get('/imprimir', protegerRuta, cajaController.imprimirCierre);

module.exports = router;