const GastoModel = require('../models/GastoModel');
const ConfigModel = require('../models/ConfigModel');
const BitacoraModel = require('../models/BitacoraModel');
const BovedaModel = require('../models/BovedaModel');

const gastosController = {

    listar: (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = 5;
            const offset = (page - 1) * limit;
            const busqueda = req.query.q || '';

            let gastos, totalRegistros;

            if (busqueda) {
                gastos = GastoModel.buscarPaginados(busqueda, limit, offset);
                totalRegistros = GastoModel.contarBusqueda(busqueda);
            } else {
                gastos = GastoModel.obtenerPaginados(limit, offset);
                totalRegistros = GastoModel.contarTotal();
            }

            const totalPages = Math.ceil(totalRegistros / limit);
            const config = ConfigModel.obtener();

            res.render('gastos/index', { 
                title: 'Gestión de Gastos',
                gastos,
                busqueda,
                currentPage: page,
                totalPages,
                totalRegistros,
                empresa: config || { moneda: '$' }
            });

        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al cargar gastos');
            res.redirect('/');
        }
    },

    guardar: (req, res) => {
        try {
            const { descripcion, monto, categoria, observacion } = req.body;
            const registrado_por = (req.session.usuario && req.session.usuario.nombre) ? req.session.usuario.nombre : 'Administrador';

            if (!descripcion || !descripcion.trim() || !monto) {
                req.flash('mensajeError', 'Descripción y Monto son obligatorios');
                return res.redirect('/gastos');
            }

            const gastoMonto = parseFloat(monto);
            if (isNaN(gastoMonto) || gastoMonto <= 0) {
                req.flash('mensajeError', 'El monto debe ser un número mayor a 0');
                return res.redirect('/gastos');
            }

            const boveda = BovedaModel.obtener();
            if (gastoMonto > parseFloat(boveda.saldo_actual)) {
                req.flash('mensajeError', `Fondos insuficientes en Bóveda para este gasto. Disponible: ${parseFloat(boveda.saldo_actual).toFixed(2)}`);
                return res.redirect('/gastos');
            }

            // Crear gasto y descontar bóveda en una transacción atómica
            GastoModel.crearConDescontarBoveda({ descripcion: descripcion.trim(), monto: gastoMonto, categoria, registrado_por, observacion });

            BitacoraModel.registrar(
                registrado_por,
                'REGISTRAR_GASTO',
                `Se registró gasto: ${descripcion.trim()} por un monto de ${gastoMonto.toFixed(2)} (${categoria})`
            );

            req.flash('mensajeExito', 'Gasto registrado correctamente');
            res.redirect('/gastos');

        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al registrar el gasto');
            res.redirect('/gastos');
        }
    },

    eliminar: (req, res) => {
        const { id } = req.params;
        try {
            const usuario = (req.session.usuario && req.session.usuario.nombre) ? req.session.usuario.nombre : 'Administrador';
            GastoModel.eliminar(id);
            BitacoraModel.registrar(usuario, 'ELIMINAR_GASTO', `Se eliminó el gasto con ID: ${id}`);

            req.flash('mensajeExito', 'Gasto eliminado');
            res.redirect('/gastos');
        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al eliminar');
            res.redirect('/gastos');
        }
    }
};

module.exports = gastosController;