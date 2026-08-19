const express = require('express');
const router = express.Router();
const bovedaController = require('../controllers/bovedaController');
const soloAdmin = require('../middleware/soloAdmin');

router.post('/inyectar', soloAdmin, bovedaController.inyectar);

module.exports = router;
