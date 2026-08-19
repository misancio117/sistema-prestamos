const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backupController');

// Middleware: Solo Admin
const esAdmin = (req, res, next) => {
    if (req.session.usuario && req.session.usuario.rol === 'admin') {
        return next();
    }
    req.flash('mensajeError', 'Acceso denegado');
    return res.redirect('/');
};

// Ruta de descarga
router.get('/descargar', esAdmin, backupController.descargar);

module.exports = router;