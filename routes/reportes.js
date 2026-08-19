const express = require('express');
const router  = express.Router();
const reportesController = require('../controllers/reportesController');

// Documentos individuales
router.get('/contrato/:id',        reportesController.generarContrato);
router.get('/ticket/:id',          reportesController.generarTicket);
router.get('/cronograma_pdf/:id',  reportesController.generarCronogramaPDF);
router.get('/estado_cuenta/:id',   reportesController.generarEstadoCuenta);
router.get('/ticket_ahorro/:id',   reportesController.generarTicketAhorro);

// Excel legacy
router.get('/excel/prestamos',     reportesController.exportarExcelPrestamos);

// Panel y reportes generales
router.get('/panel',               reportesController.mostrarPanel);
router.post('/preview',            reportesController.previewReporte);
router.post('/generar',            reportesController.descargarReporteExcel);
router.get('/cartera-vencida/pdf', reportesController.descargarCarteraVencidaPDF);

module.exports = router;
