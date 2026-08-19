const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');
const upload = require('../middleware/upload'); // Reutilizamos tu middleware de subida

// Middleware para validar Admin
const esAdmin = (req, res, next) => {
    if (req.session.usuario && req.session.usuario.rol === 'admin') {
        return next();
    }
    req.flash('mensajeError', 'Acceso denegado');
    return res.redirect('/');
};

router.get('/', esAdmin, configController.mostrar);
router.post('/actualizar', esAdmin, upload.single('logo'), configController.actualizar);
router.post('/limpiar-bd', esAdmin, configController.limpiarBD);

module.exports = router;