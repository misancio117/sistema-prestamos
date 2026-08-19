const PagoModel = require('../models/PagoModel');
const BitacoraModel = require('../models/BitacoraModel');
const BovedaModel = require('../models/BovedaModel');
const PrestamoModel = require('../models/PrestamoModel');
const ConfigModel = require('../models/ConfigModel');
const EmpenoModel = require('../models/EmpenoModel');
const emailService = require('../utils/emailService');
const finance = require('../utils/finance');
const { Decimal } = require('decimal.js');

const pagosController = {

    // 1. Mostrar formulario de cobro
    mostrarFormulario: (req, res) => {
        const { id_prestamo } = req.params;
        try {
            const prestamo = PrestamoModel.obtenerPorId(id_prestamo);
            const config = ConfigModel.obtener();
            const empeno = EmpenoModel.obtenerPorPrestamo(id_prestamo);
            
            if (!prestamo) {
                req.flash('mensajeError', 'El préstamo no existe');
                return res.redirect('/prestamos');
            }

            const totalPagado = parseFloat(PagoModel.obtenerTotalPagado(id_prestamo));
            const totalDeuda = parseFloat(prestamo.monto_total);
            const saldoPendiente = parseFloat(
                new Decimal(totalDeuda).minus(totalPagado).toDecimalPlaces(2).toString()
            );

            // Calcular liquidación anticipada con precisión Decimal
            const hoy = new Date();
            const inicio = new Date(prestamo.fecha_inicio);
            const diffTime = Math.abs(hoy - inicio);
            let diasTranscurridos = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diasTranscurridos < 1) diasTranscurridos = 1;

            const dMontoPrestado = new Decimal(prestamo.monto_prestado);
            const dTasa = new Decimal(prestamo.tasa_interes);
            const dTotalPagado = new Decimal(totalPagado);
            const dInteresDiario = dMontoPrestado.mul(dTasa.div(100)).div(30);
            const dLiquidacion = dMontoPrestado.plus(dInteresDiario.mul(diasTranscurridos)).minus(dTotalPagado);
            let liquidacionTotal = dLiquidacion.isNegative()
                ? 0
                : dLiquidacion.toDecimalPlaces(2).toNumber();
            if (liquidacionTotal > saldoPendiente) liquidacionTotal = saldoPendiente;

            const historial = PagoModel.obtenerHistorial(id_prestamo);
            const empresaConfig = config || { moneda: '$' };

            res.render('pagos/registrar', {
                title: 'Registrar Pago',
                prestamo,
                empeno,
                saldoPendiente,
                liquidacionTotal,
                historial,
                empresa: empresaConfig
            });

        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al cargar el préstamo');
            res.redirect('/prestamos');
        }
    },

    // 2. Guardar el pago
    guardar: (req, res) => {
        const { prestamo_id, monto_pagado, observaciones, es_liquidacion } = req.body;

        try {
            const montoPagadoFloat = parseFloat(monto_pagado);

            if (!monto_pagado || isNaN(montoPagadoFloat) || montoPagadoFloat <= 0) {
                req.flash('mensajeError', 'El monto debe ser un número mayor a 0');
                return res.redirect(`/pagos/registrar/${prestamo_id}`);
            }

            const prestamo = PrestamoModel.obtenerPorId(prestamo_id);
            if (!prestamo) {
                req.flash('mensajeError', 'Préstamo no encontrado');
                return res.redirect('/prestamos');
            }

            const totalPagado = parseFloat(PagoModel.obtenerTotalPagado(prestamo_id));
            let saldoPendiente = parseFloat(
                new Decimal(prestamo.monto_total).minus(totalPagado).toDecimalPlaces(2).toString()
            );

            // Si es liquidación anticipada
            if (es_liquidacion === 'si') {
                const hoy = new Date();
                const inicio = new Date(prestamo.fecha_inicio);
                const diffTime = Math.abs(hoy - inicio);
                let diasTranscurridos = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diasTranscurridos < 1) diasTranscurridos = 1;

                const dMontoPrestado = new Decimal(prestamo.monto_prestado);
                const dTasa = new Decimal(prestamo.tasa_interes);
                const dTotalPagado = new Decimal(totalPagado);
                const dInteresDiario = dMontoPrestado.mul(dTasa.div(100)).div(30);
                const dLiquidacion = dMontoPrestado.plus(dInteresDiario.mul(diasTranscurridos)).minus(dTotalPagado);
                let liquidacionTotal = dLiquidacion.isNegative()
                    ? 0
                    : dLiquidacion.toDecimalPlaces(2).toNumber();
                if (liquidacionTotal > saldoPendiente) liquidacionTotal = saldoPendiente;

                if (montoPagadoFloat >= (liquidacionTotal - 0.01)) {
                    const nuevoMontoTotal = new Decimal(totalPagado).plus(montoPagadoFloat).toDecimalPlaces(2).toNumber();
                    PrestamoModel.actualizarMontoTotal(prestamo_id, nuevoMontoTotal);
                    saldoPendiente = montoPagadoFloat;
                    prestamo.monto_total = nuevoMontoTotal;
                }
            }

            if (montoPagadoFloat > saldoPendiente + 0.01 && es_liquidacion !== 'si') {
                req.flash('mensajeError', `El monto excede la deuda. Solo debe: ${saldoPendiente.toFixed(2)}`);
                return res.redirect(`/pagos/registrar/${prestamo_id}`);
            }

            // Crear pago y sumar a bóveda en una transacción atómica
            const resultNuevoPago = PagoModel.crearConSumarBoveda({ prestamo_id, monto_pagado: montoPagadoFloat, observaciones });
            const nuevoPagoId = resultNuevoPago.lastInsertRowid;

            // Verificar si liquidó
            const nuevoTotalPagado = totalPagado + montoPagadoFloat;
            if (nuevoTotalPagado >= (parseFloat(prestamo.monto_total) - 0.01)) {
                PrestamoModel.actualizarEstado(prestamo_id, 'pagado');
                EmpenoModel.liberarPorPrestamo(prestamo_id);
            }

            // Enviar Correo (no bloquea)
            if (prestamo.email) {
                const config = ConfigModel.obtener();
                const simboloMoneda = config ? config.moneda : '$';
                const nuevoSaldo = saldoPendiente - parseFloat(monto_pagado);
                const htmlCorreo = emailService.plantillaPago(
                    `${prestamo.nombre} ${prestamo.apellido}`,
                    monto_pagado, new Date(), nuevoSaldo, simboloMoneda
                );
                emailService.enviarCorreo(prestamo.email, 'Pago Recibido - Comprobante Digital', htmlCorreo);
            }

            // Bitácora
            const usuarioActual = req.session.usuario ? req.session.usuario.nombre : 'Sistema';
            BitacoraModel.registrar(usuarioActual, 'REGISTRAR COBRO', `Cobro de ${montoPagadoFloat.toFixed(2)} al Préstamo #${prestamo_id} (${prestamo.nombre} ${prestamo.apellido})`);

            req.flash('mensajeExito', 'Pago registrado y recibo enviado por correo');
            res.redirect(`/pagos/boleta/${nuevoPagoId}`);

        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al registrar el pago');
            res.redirect('/prestamos');
        }
    },

    // 3. Imprimir Boleta
    boleta: (req, res) => {
        try {
            const { id } = req.params;
            const pago = PagoModel.obtenerDetalle(id);
            if (!pago) return res.redirect('/prestamos');

            const prestamo = PrestamoModel.obtenerPorId(pago.prestamo_id);
            const totalPagado = PagoModel.obtenerTotalPagado(pago.prestamo_id);
            const config = ConfigModel.obtener();
            
            let saldoActual = parseFloat(prestamo.monto_total) - parseFloat(totalPagado);
            if (saldoActual < 0) saldoActual = 0;

            const cronograma = finance.calcularCronograma(
                parseFloat(prestamo.monto_total), 
                prestamo.cuotas, 
                prestamo.frecuencia, 
                prestamo.fecha_inicio
            );
            
            let acumuladoPagado = parseFloat(totalPagado);
            let proximaFecha = null;
            
            for (let cuota of cronograma) {
                const montoCuota = parseFloat(cuota.monto);
                if (acumuladoPagado >= montoCuota - 0.01) {
                    acumuladoPagado -= montoCuota;
                } else {
                    proximaFecha = cuota.fecha;
                    break;
                }
            }

            res.render('pagos/boleta', {
                pago, 
                prestamo, 
                saldoActual, 
                proximaFecha,
                empresa: config || { moneda: '$', logo: null }
            });
        } catch (error) {
            console.error(error);
            res.redirect('/prestamos');
        }
    }
};

module.exports = pagosController;