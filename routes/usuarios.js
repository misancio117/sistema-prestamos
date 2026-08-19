const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');

// Middleware simple para verificar si es Admin
const esAdmin = (req, res, next) => {
    if (req.session.usuario && req.session.usuario.rol === 'admin') {
        return next();
    }
    req.flash('mensajeError', 'Acceso denegado: Solo administradores.');
    return res.redirect('/');
};

// Rutas protegidas con esAdmin
router.get('/', esAdmin, usuariosController.listar);
router.get('/crear', esAdmin, usuariosController.mostrarFormulario);
router.post('/guardar', esAdmin, usuariosController.guardar);
router.get('/eliminar/:id', esAdmin, usuariosController.eliminar);

module.exports = router;