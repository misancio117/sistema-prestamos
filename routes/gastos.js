const express = require('express');
const router = express.Router();
const gastosController = require('../controllers/gastosController');
const protegerRuta = require('../middleware/auth');
const soloAdmin = require('../middleware/soloAdmin');

router.use(protegerRuta);

router.get('/', gastosController.listar);
router.post('/guardar', gastosController.guardar);
router.get('/eliminar/:id', soloAdmin, gastosController.eliminar);

module.exports = router;