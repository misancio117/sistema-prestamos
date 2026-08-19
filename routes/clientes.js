const express = require('express');
const router = express.Router();
const clientesController = require('../controllers/clientesController');
const upload = require('../middleware/upload'); 

// Listar
router.get('/', clientesController.listar);

// Autocomplete JSON
router.get('/buscar', clientesController.buscarAutocomplete);

// Crear
router.get('/crear', clientesController.mostrarFormulario);
router.post('/guardar', upload.single('foto'), clientesController.guardar);

// Ver Perfil
router.get('/ver/:id', clientesController.verPerfil);

// Editar (ESTAS SON LAS RUTAS QUE NECESITA EL BOTÓN)
router.get('/editar/:id', clientesController.mostrarEdicion);
router.post('/actualizar/:id', upload.single('foto'), clientesController.actualizar);

module.exports = router;