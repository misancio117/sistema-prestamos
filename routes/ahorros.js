const express = require('express');
const router = express.Router();
const ahorrosController = require('../controllers/ahorrosController');

// Listar todas las cuentas
router.get('/', ahorrosController.listar);

// Apertura
router.get('/aperturar', ahorrosController.aperturar);
router.post('/guardar', ahorrosController.guardarCuenta);

// Ver y Operar (Transacciones)
router.get('/ver/:id', ahorrosController.verCuenta);
router.post('/transaccion', ahorrosController.procesarTransaccion);

module.exports = router;