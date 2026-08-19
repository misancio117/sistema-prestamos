const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');

// Máximo 10 intentos de login por IP cada 15 minutos
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: null, // usamos handler para flash message
    handler: (req, res) => {
        req.flash('mensajeError', 'Demasiados intentos fallidos. Espera 15 minutos e intenta de nuevo.');
        res.redirect('/auth/login');
    },
    standardHeaders: true,
    legacyHeaders: false
});

router.get('/login', authController.mostrarLogin);
router.post('/login', loginLimiter, authController.login);
router.get('/logout', authController.logout);

module.exports = router;