const express = require('express');
const router = express.Router();
const prestamosController = require('../controllers/prestamosController');
const upload = require('../middleware/upload'); // <--- Para subir fotos de garantía

// Listar
router.get('/', prestamosController.listar);

// Reportes especiales
router.get('/vencidos', prestamosController.verVencidos);
router.get('/finalizados', prestamosController.verFinalizados);
router.get('/cronograma/:id', prestamosController.verCronograma);

// Crear
router.get('/crear', prestamosController.mostrarFormulario);
router.post('/guardar', upload.single('empeno_imagen'), prestamosController.guardar);

// Editar
router.get('/editar/:id', prestamosController.mostrarEdicion);
router.post('/actualizar/:id', prestamosController.actualizar);
router.post('/finalizar/:id', prestamosController.finalizar);

// Detalle JSON (API)
router.get('/detalle/:id', prestamosController.detalleJson);

// Contrato
router.get('/:id/contrato', prestamosController.imprimirContrato);

module.exports = router;