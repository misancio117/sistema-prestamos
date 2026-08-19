const AhorroModel = require('../models/AhorroModel');
const ClienteModel = require('../models/ClienteModel');
const ConfigModel = require('../models/ConfigModel');
const BitacoraModel = require('../models/BitacoraModel');
const emailService = require('../utils/emailService');

const ahorrosController = {

    // 1. Listar Cuentas
    listar: (req, res) => {
        try {
            const cuentas = AhorroModel.obtenerTodas();
            res.render('ahorros/index', { title: 'Cuentas de Ahorro', cuentas });
        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al cargar cuentas');
            res.redirect('/');
        }
    },

    // 2. Aperturar cuenta
    aperturar: (req, res) => {
        try {
            const clientes = ClienteModel.obtenerTodos();
            res.render('ahorros/aperturar', { title: 'Nueva Cuenta de Ahorros', clientes });
        } catch (error) {
            console.error(error);
            res.redirect('/ahorros');
        }
    },

    // 3. Guardar nueva cuenta
    guardarCuenta: (req, res) => {
        const { cliente_id, tasa_interes, plazo_meses } = req.body;
        try {
            const existe = AhorroModel.buscarPorCliente(cliente_id);
            if (existe) {
                req.flash('mensajeError', 'Este cliente ya tiene una cuenta activa');
                return res.redirect('/ahorros/aperturar');
            }

            const tasaFinal = parseFloat(tasa_interes) || 0;
            const plazoFinal = parseInt(plazo_meses) || 0;
            AhorroModel.crear(cliente_id, tasaFinal, plazoFinal);

            const usuarioActual = req.session.usuario ? req.session.usuario.nombre : 'Sistema';
            const clienteInfo = ClienteModel.obtenerPorId(cliente_id);
            BitacoraModel.registrar(usuarioActual, 'APERTURAR CUENTA AHORRO', `Cuenta de ahorros creada para ${clienteInfo.nombre} ${clienteInfo.apellido}`);

            req.flash('mensajeExito', 'Cuenta aperturada correctamente');
            res.redirect('/ahorros');

        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al crear cuenta');
            res.redirect('/ahorros');
        }
    },

    // 4. Ver Movimientos
    verCuenta: (req, res) => {
        const { id } = req.params;
        try {
            const cuenta = AhorroModel.obtenerPorId(id);
            if (!cuenta) return res.redirect('/ahorros');

            const movimientos = AhorroModel.obtenerMovimientos(id);

            res.render('ahorros/ver', { title: 'Detalle de Cuenta', cuenta, movimientos });
        } catch (error) {
            console.error(error);
            res.redirect('/ahorros');
        }
    },

    // 5. Procesar Transacción
    procesarTransaccion: (req, res) => {
        const { cuenta_id, tipo, monto, observacion } = req.body;
        
        try {
            const montoFloat = parseFloat(monto);
            if (montoFloat <= 0) {
                req.flash('mensajeError', 'El monto debe ser mayor a 0');
                return res.redirect(`/ahorros/ver/${cuenta_id}`);
            }

            const cuenta = AhorroModel.obtenerPorId(cuenta_id);

            if (tipo === 'retiro' && montoFloat > parseFloat(cuenta.saldo_actual)) {
                req.flash('mensajeError', 'Saldo insuficiente para realizar el retiro');
                return res.redirect(`/ahorros/ver/${cuenta_id}`);
            }

            AhorroModel.registrarMovimiento(cuenta_id, tipo, montoFloat, observacion);

            let nuevoSaldo = parseFloat(cuenta.saldo_actual);
            if (tipo === 'deposito') nuevoSaldo += montoFloat;
            else nuevoSaldo -= montoFloat;

            // Correo (no bloquea)
            if (cuenta.email) {
                const config = ConfigModel.obtener();
                const simboloMoneda = config ? config.moneda : '$';
                const html = emailService.plantillaAhorro(
                    `${cuenta.nombre} ${cuenta.apellido}`, tipo, montoFloat, nuevoSaldo, simboloMoneda
                );
                emailService.enviarCorreo(cuenta.email, `Notificación de ${tipo.toUpperCase()}`, html);
            }

            const usuarioActual = req.session.usuario ? req.session.usuario.nombre : 'Sistema';
            BitacoraModel.registrar(usuarioActual, 'TRANSACCIÓN AHORRO', `${tipo.toUpperCase()} de ${montoFloat.toFixed(2)} en cuenta #${cuenta_id} (${cuenta.nombre} ${cuenta.apellido})`);

            req.flash('mensajeExito', 'Transacción realizada con éxito');
            res.redirect(`/ahorros/ver/${cuenta_id}`);

        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error en la transacción');
            res.redirect(`/ahorros/ver/${cuenta_id}`);
        }
    }
};

module.exports = ahorrosController;