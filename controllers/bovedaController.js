const BovedaModel = require('../models/BovedaModel');
const BitacoraModel = require('../models/BitacoraModel');

const bovedaController = {
    inyectar: (req, res) => {
        try {
            const { monto } = req.body;
            if (!monto || parseFloat(monto) <= 0) {
                req.flash('mensajeError', 'El monto a inyectar debe ser mayor a 0');
                return res.redirect('/');
            }

            BovedaModel.inyectarCapital(parseFloat(monto));

            const usuarioActual = req.session.usuario ? req.session.usuario.nombre : 'Sistema';
            BitacoraModel.registrar(usuarioActual, 'INYECCIÓN DE CAPITAL', `Se inyectaron ${parseFloat(monto).toFixed(2)} a la Bóveda Principal`);

            req.flash('mensajeExito', `Se han inyectado ${parseFloat(monto).toFixed(2)} al Capital de la Bóveda exitosamente.`);
            res.redirect('/');
        } catch (error) {
            console.error('Error al inyectar capital a bóveda:', error);
            req.flash('mensajeError', 'Error crítico procesando inyección de capital');
            res.redirect('/');
        }
    }
};

module.exports = bovedaController;
