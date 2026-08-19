const BitacoraModel = require('../models/BitacoraModel');

const bitacoraController = {
    
    // Mostrar la pantalla de auditoría
    mostrar: (req, res) => {
        try {
            const registros = BitacoraModel.obtenerUltimos(100);
            res.render('bitacora/index', {
                title: 'Auditoría del Sistema',
                registros
            });
        } catch (error) {
            console.error("Error cargando bitácora:", error);
            res.redirect('/');
        }
    }
};

module.exports = bitacoraController;