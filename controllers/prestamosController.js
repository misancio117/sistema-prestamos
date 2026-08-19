const PrestamoModel = require('../models/PrestamoModel');
const ClienteModel = require('../models/ClienteModel');
const ConfigModel = require('../models/ConfigModel');
const EmpenoModel = require('../models/EmpenoModel');
const BovedaModel = require('../models/BovedaModel');
const BitacoraModel = require('../models/BitacoraModel');
const emailService = require('../utils/emailService');
const finance = require('../utils/finance');
const { FRECUENCIAS_VALIDAS } = require('../utils/constants');

const prestamosController = {

    // 1. Listar préstamos
    listar: (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = 5;
            const offset = (page - 1) * limit;
            const busqueda = req.query.q || '';

            let prestamos, totalRegistros;

            if (busqueda) {
                prestamos = PrestamoModel.buscarPaginados(busqueda, limit, offset);
                totalRegistros = PrestamoModel.contarBusqueda(busqueda);
            } else {
                prestamos = PrestamoModel.obtenerPaginados(limit, offset);
                totalRegistros = PrestamoModel.contarTotal();
            }

            const totalPages = Math.ceil(totalRegistros / limit);
            const config = ConfigModel.obtener();

            const PagoModel = require('../models/PagoModel');
            const prestamosMapeados = prestamos.map(p => {
                const totalPagado = PagoModel.obtenerTotalPagado(p.id);
                const saldoPendiente = Math.max(0, parseFloat(p.monto_total) - totalPagado);
                const porcentajeCompletado = parseFloat(p.monto_total) > 0
                    ? Math.min(100, Math.round((totalPagado / parseFloat(p.monto_total)) * 100))
                    : 0;
                return {
                    ...p,
                    totalPagado,
                    saldoPendiente,
                    porcentajeCompletado,
                    tienePagos: totalPagado > 0
                };
            });

            res.render('prestamos/index', { 
                title: 'Gestión de Préstamos',
                prestamos: prestamosMapeados,
                busqueda,
                currentPage: page,
                totalPages,
                totalRegistros,
                empresa: config || { moneda: '$' }
            });

        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al cargar los préstamos');
            res.redirect('/');
        }
    },

    // 2. Formulario de nuevo préstamo
    mostrarFormulario: (req, res) => {
        try {
            const clientes = ClienteModel.obtenerTodos();
            const config = ConfigModel.obtener();

            res.render('prestamos/crear', { 
                title: 'Nuevo Préstamo',
                clientes,
                empresa: config || { moneda: '$' }
            });
        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al cargar el formulario');
            res.redirect('/prestamos');
        }
    },

    // 3. Guardar préstamo
    guardar: (req, res) => {
        try {
            const {
                cliente_id, monto, interes, cuotas, frecuencia, fecha_inicio, sistema_pago,
                empeno_nombre_articulo, empeno_descripcion, empeno_valor_tasacion,
                fecha_primer_cobro
            } = req.body;

            const imagenGarantia = req.file ? req.file.filename : null;

            // --- Validaciones de entrada ---
            if (!cliente_id || !monto || !cuotas || !fecha_inicio) {
                req.flash('mensajeError', 'Por favor complete los campos obligatorios');
                return res.redirect('/prestamos/crear');
            }

            const montoPrestado = parseFloat(monto);
            const tasa = parseFloat(interes) || 0;
            const numCuotas = parseInt(cuotas);

            if (isNaN(montoPrestado) || montoPrestado <= 0) {
                req.flash('mensajeError', 'El monto debe ser un número mayor a 0');
                return res.redirect('/prestamos/crear');
            }

            if (isNaN(tasa) || tasa < 0 || tasa > 100) {
                req.flash('mensajeError', 'La tasa de interés debe estar entre 0% y 100%');
                return res.redirect('/prestamos/crear');
            }

            if (isNaN(numCuotas) || numCuotas < 1 || numCuotas > 600) {
                req.flash('mensajeError', 'El número de cuotas debe estar entre 1 y 600');
                return res.redirect('/prestamos/crear');
            }

            const frecuenciaFinal = frecuencia || 'mensual';
            if (!FRECUENCIAS_VALIDAS.includes(frecuenciaFinal)) {
                req.flash('mensajeError', 'Frecuencia de pago no válida');
                return res.redirect('/prestamos/crear');
            }

            if (empeno_valor_tasacion && montoPrestado > parseFloat(empeno_valor_tasacion)) {
                req.flash('mensajeError', 'El monto prestado no puede ser mayor al valor de la garantía depositada.');
                return res.redirect('/prestamos/crear');
            }
            // --- Fin validaciones ---

            const sistema = sistema_pago || 'frances';

            // Validar fondos de Bóveda
            const boveda = BovedaModel.obtener();
            if (montoPrestado > parseFloat(boveda.saldo_actual)) {
                req.flash('mensajeError', `Fondos insuficientes en la Bóveda Principal. Capital disponible: ${parseFloat(boveda.saldo_actual).toFixed(2)}`);
                return res.redirect('/prestamos/crear');
            }

            // Calcular fecha de primer cobro por defecto si no viene
            let fechaPrimerCobroFinal = fecha_primer_cobro;
            if (!fechaPrimerCobroFinal) {
                let dateObj = finance.parseLocalDate(fecha_inicio);
                dateObj = finance.sumarFecha(dateObj, frecuenciaFinal);
                fechaPrimerCobroFinal = finance.formatLocalDate(dateObj);
            }

            // Calculamos con finance (soportando Aleman o Frances, con fechaPrimerCobro)
            const plan = finance.calcularPlan(montoPrestado, tasa, numCuotas, frecuenciaFinal, fecha_inicio, sistema, fechaPrimerCobroFinal);
            const montoTotal = plan.montoTotal;

            const cronograma = plan.cronograma;
            const fechaFinStr = cronograma.length > 0
                ? finance.formatLocalDate(cronograma[cronograma.length - 1].fecha)
                : fechaPrimerCobroFinal;

            // Crear préstamo y descontar bóveda en una transacción atómica
            const prestamoResult = PrestamoModel.crearConDescontarBoveda({
                cliente_id,
                monto_prestado: montoPrestado,
                tasa_interes: tasa,
                monto_total: montoTotal,
                cuotas: numCuotas,
                frecuencia: frecuenciaFinal,
                fecha_inicio,
                fecha_fin: fechaFinStr,
                sistema_pago: sistema,
                fecha_primer_cobro: fechaPrimerCobroFinal
            });

            const nuevoPrestamoId = prestamoResult.lastInsertRowid;

            if (empeno_nombre_articulo && empeno_valor_tasacion) {
                EmpenoModel.crear({
                    cliente_id,
                    nombre_articulo: empeno_nombre_articulo,
                    descripcion: empeno_descripcion || '',
                    valor_tasacion: parseFloat(empeno_valor_tasacion),
                    monto_prestado: montoPrestado,
                    fecha_limite: fechaFinStr,
                    imagen: imagenGarantia,
                    prestamo_id: nuevoPrestamoId
                });
            }

            // Envío de correo (asíncrono, no bloquea la respuesta)
            const cliente = ClienteModel.obtenerPorId(cliente_id);
            if (cliente && cliente.email) {
                const config = ConfigModel.obtener();
                const simboloMoneda = config ? config.moneda : '$';
                const htmlCorreo = emailService.plantillaPrestamo(
                    `${cliente.nombre} ${cliente.apellido}`,
                    montoPrestado, cuotas, montoTotal, simboloMoneda
                );
                emailService.enviarCorreo(cliente.email, '¡Préstamo Aprobado! - Financiera', htmlCorreo);
            }

            // Bitácora
            const usuarioActual = req.session.usuario ? req.session.usuario.nombre : 'Sistema';
            const clienteInfo = ClienteModel.obtenerPorId(cliente_id);
            BitacoraModel.registrar(usuarioActual, 'OTORGAR PRÉSTAMO', `Préstamo #${nuevoPrestamoId} a ${clienteInfo.nombre} ${clienteInfo.apellido} por ${montoPrestado.toFixed(2)}`);

            req.flash('mensajeExito', 'Préstamo registrado correctamente');
            res.redirect('/prestamos');

        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al crear el préstamo');
            res.redirect('/prestamos/crear');
        }
    },

    // 4. Ver Vencidos
    verVencidos: (req, res) => {
        try {
            const vencidos = PrestamoModel.obtenerVencidos();
            const config = ConfigModel.obtener();
            res.render('prestamos/vencidos', { 
                title: 'Reporte de Morosidad',
                vencidos,
                empresa: config || { moneda: '$' }
            });
        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al cargar vencimientos');
            res.redirect('/prestamos');
        }
    },

    // 5. Ver Cronograma
    verCronograma: (req, res) => {
        const { id } = req.params;
        try {
            const prestamo = PrestamoModel.obtenerPorId(id);
            if (!prestamo) {
                req.flash('mensajeError', 'Préstamo no encontrado');
                return res.redirect('/prestamos');
            }

            const plan = finance.calcularPlan(
                parseFloat(prestamo.monto_prestado),
                parseFloat(prestamo.tasa_interes),
                prestamo.cuotas, 
                prestamo.frecuencia, 
                prestamo.fecha_inicio,
                prestamo.sistema_pago || 'frances',
                prestamo.fecha_primer_cobro
            );
            const cronograma = plan.cronograma;

            const PagoModel = require('../models/PagoModel');
            let acumuladoPagado = parseFloat(PagoModel.obtenerTotalPagado(id));

            cronograma.forEach(cuota => {
                const montoCuota = parseFloat(cuota.monto);
                if (acumuladoPagado >= montoCuota - 0.01) {
                    cuota.estado = 'pagado';
                    acumuladoPagado -= montoCuota;
                } else if (acumuladoPagado > 0) {
                    cuota.estado = 'parcial';
                    cuota.pagado_parcial = acumuladoPagado;
                    acumuladoPagado = 0;
                } else {
                    cuota.estado = 'programado';
                }
            });

            const config = ConfigModel.obtener();

            res.render('prestamos/cronograma', {
                title: 'Cronograma de Pagos',
                prestamo,
                cronograma,
                empresa: config || { moneda: '$' }
            });

        } catch (error) {
            console.error(error);
            res.redirect('/prestamos');
        }
    },

    // 6. Imprimir Contrato de Empeño
    imprimirContrato: (req, res) => {
        const { id } = req.params;
        try {
            const prestamo = PrestamoModel.obtenerPorId(id);
            if (!prestamo) return res.status(404).send('Préstamo no encontrado');

            const plan = finance.calcularPlan(
                parseFloat(prestamo.monto_prestado),
                parseFloat(prestamo.tasa_interes),
                prestamo.cuotas, 
                prestamo.frecuencia, 
                prestamo.fecha_inicio,
                prestamo.sistema_pago || 'frances',
                prestamo.fecha_primer_cobro
            );

            const empeno = EmpenoModel.obtenerPorPrestamo(id);
            const cliente = ClienteModel.obtenerPorId(prestamo.cliente_id);
            const config = ConfigModel.obtener();
            
            res.render('prestamos/contrato', {
                layout: false,
                prestamo,
                empeno: empeno || {},
                cliente,
                empresa: config || {},
                fechaPrimerPago: plan.cronograma[0]?.fecha,
                fechaUltimaPago: plan.cronograma[plan.cronograma.length - 1]?.fecha
            });
        } catch (error) {
            console.error(error);
            res.status(500).send('Error al generar el contrato');
        }
    },

    // 7. Mostrar formulario de edición
    mostrarEdicion: (req, res) => {
        const { id } = req.params;
        try {
            const prestamo = PrestamoModel.obtenerPorId(id);
            if (!prestamo) {
                req.flash('mensajeError', 'Préstamo no encontrado');
                return res.redirect('/prestamos');
            }

            const PagoModel = require('../models/PagoModel');
            const totalPagado = PagoModel.obtenerTotalPagado(id);
            if (totalPagado > 0) {
                req.flash('mensajeError', 'No se puede editar un préstamo que ya tiene pagos registrados');
                return res.redirect('/prestamos');
            }

            const empeno = EmpenoModel.obtenerPorPrestamo(id);
            const clientes = ClienteModel.obtenerTodos();
            const config = ConfigModel.obtener();

            res.render('prestamos/editar', {
                title: 'Editar Préstamo',
                prestamo,
                empeno: empeno || null,
                clientes,
                empresa: config || { moneda: '$' }
            });
        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al cargar el formulario de edición');
            res.redirect('/prestamos');
        }
    },

    // 8. Actualizar préstamo
    actualizar: (req, res) => {
        const { id } = req.params;
        try {
            const {
                monto, interes, cuotas, frecuencia, fecha_inicio, sistema_pago,
                fecha_primer_cobro
            } = req.body;

            const prestamoOriginal = PrestamoModel.obtenerPorId(id);
            if (!prestamoOriginal) {
                req.flash('mensajeError', 'Préstamo no encontrado');
                return res.redirect('/prestamos');
            }

            const PagoModel = require('../models/PagoModel');
            const totalPagado = PagoModel.obtenerTotalPagado(id);
            if (totalPagado > 0) {
                req.flash('mensajeError', 'No se puede editar un préstamo que ya tiene pagos registrados');
                return res.redirect('/prestamos');
            }

            // --- Validaciones de entrada ---
            if (!monto || !cuotas || !fecha_inicio) {
                req.flash('mensajeError', 'Por favor complete los campos obligatorios');
                return res.redirect(`/prestamos/editar/${id}`);
            }

            const montoPrestado = parseFloat(monto);
            const tasa = parseFloat(interes) || 0;
            const numCuotas = parseInt(cuotas);

            if (isNaN(montoPrestado) || montoPrestado <= 0) {
                req.flash('mensajeError', 'El monto debe ser un número mayor a 0');
                return res.redirect(`/prestamos/editar/${id}`);
            }

            if (isNaN(tasa) || tasa < 0 || tasa > 100) {
                req.flash('mensajeError', 'La tasa de interés debe estar entre 0% y 100%');
                return res.redirect(`/prestamos/editar/${id}`);
            }

            if (isNaN(numCuotas) || numCuotas < 1 || numCuotas > 600) {
                req.flash('mensajeError', 'El número de cuotas debe estar entre 1 y 600');
                return res.redirect(`/prestamos/editar/${id}`);
            }

            const frecuenciaFinal = frecuencia || 'mensual';
            if (!FRECUENCIAS_VALIDAS.includes(frecuenciaFinal)) {
                req.flash('mensajeError', 'Frecuencia de pago no válida');
                return res.redirect(`/prestamos/editar/${id}`);
            }
            // --- Fin validaciones ---

            const sistema = sistema_pago || 'frances';

            // Validar fondos de Bóveda para la diferencia
            const diffMonto = montoPrestado - parseFloat(prestamoOriginal.monto_prestado);
            if (diffMonto > 0) {
                const boveda = BovedaModel.obtener();
                if (diffMonto > parseFloat(boveda.saldo_actual)) {
                    req.flash('mensajeError', `Fondos insuficientes en la Bóveda Principal para ampliar el préstamo. Capital adicional requerido: ${diffMonto.toFixed(2)}, disponible: ${parseFloat(boveda.saldo_actual).toFixed(2)}`);
                    return res.redirect(`/prestamos/editar/${id}`);
                }
            }

            // Calcular fecha de primer cobro por defecto si no viene
            let fechaPrimerCobroFinal = fecha_primer_cobro;
            if (!fechaPrimerCobroFinal) {
                let dateObj = finance.parseLocalDate(fecha_inicio);
                dateObj = finance.sumarFecha(dateObj, frecuenciaFinal);
                fechaPrimerCobroFinal = finance.formatLocalDate(dateObj);
            }

            // Calcular nuevo plan (con fechaPrimerCobro)
            const plan = finance.calcularPlan(montoPrestado, tasa, numCuotas, frecuenciaFinal, fecha_inicio, sistema, fechaPrimerCobroFinal);
            const montoTotal = plan.montoTotal;

            const cronograma = plan.cronograma;
            const fechaFinStr = cronograma.length > 0
                ? finance.formatLocalDate(cronograma[cronograma.length - 1].fecha)
                : fechaPrimerCobroFinal;

            // Ejecutar la actualización y ajuste de bóveda de forma atómica
            PrestamoModel.actualizarConAjustarBoveda(id, {
                monto_prestado: montoPrestado,
                tasa_interes: tasa,
                monto_total: montoTotal,
                cuotas: numCuotas,
                frecuencia: frecuenciaFinal,
                fecha_inicio,
                fecha_fin: fechaFinStr,
                sistema_pago: sistema,
                fecha_primer_cobro: fechaPrimerCobroFinal
            }, diffMonto);

            // Bitácora
            const usuarioActual = req.session.usuario ? req.session.usuario.nombre : 'Sistema';
            BitacoraModel.registrar(usuarioActual, 'EDITAR PRÉSTAMO', `Modificado préstamo #${id} de cliente ${prestamoOriginal.nombre} ${prestamoOriginal.apellido}. Anterior monto: ${prestamoOriginal.monto_prestado}, Nuevo monto: ${montoPrestado}`);

            req.flash('mensajeExito', 'Préstamo actualizado y plan de pagos reajustado correctamente');
            res.redirect('/prestamos');

        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al actualizar el préstamo');
            res.redirect(`/prestamos/editar/${id}`);
        }
    },

    // 9. Finalizar préstamo (deuda finalizada sin cobrar/sumar a bóveda)
    finalizar: (req, res) => {
        const { id } = req.params;
        const { motivo, estado_garantia } = req.body;
        
        try {
            if (!motivo) {
                req.flash('mensajeError', 'El motivo de finalización es obligatorio');
                return res.redirect('/prestamos');
            }

            const prestamo = PrestamoModel.obtenerPorId(id);
            if (!prestamo) {
                req.flash('mensajeError', 'Préstamo no encontrado');
                return res.redirect('/prestamos');
            }

            if (prestamo.estado === 'pagado' || prestamo.estado === 'finalizado') {
                req.flash('mensajeError', 'El préstamo ya está cerrado');
                return res.redirect('/prestamos');
            }

            // Actualizar estado a finalizado y guardar el motivo
            const query = 'UPDATE prestamos SET estado = ?, motivo_finalizacion = ? WHERE id = ?';
            const db = require('../config/database');
            db.prepare(query).run('finalizado', motivo, id);

            // Actualizar empeño si existe
            const empeno = EmpenoModel.obtenerPorPrestamo(id);
            if (empeno) {
                const estadoGarantia = estado_garantia || 'devuelto';
                if (estadoGarantia === 'abandonado') {
                    EmpenoModel.cambiarEstado(empeno.id, 'abandonado');
                    EmpenoModel.actualizarEstadoGarantia(empeno.id, 'abandonado');
                } else {
                    EmpenoModel.cambiarEstado(empeno.id, 'devuelto');
                    EmpenoModel.actualizarEstadoGarantia(empeno.id, 'devuelto');
                }
            }

            // Registrar en Bitácora
            const usuarioActual = req.session.usuario ? req.session.usuario.nombre : 'Sistema';
            const garantiaTexto = estado_garantia === 'abandonado' ? ' (garantía abandonada)' : ' (garantía devuelta)';
            BitacoraModel.registrar(
                usuarioActual, 
                'FINALIZAR DEUDA', 
                `Préstamo #${id} de ${prestamo.nombre} ${prestamo.apellido} finalizado sin cobro. Motivo: ${motivo}${garantiaTexto}`
            );

            req.flash('mensajeExito', 'Préstamo finalizado correctamente');
            res.redirect('/prestamos');

        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al finalizar el préstamo');
            res.redirect('/prestamos');
        }
    },

    // 10. Ver histórico de préstamos finalizados
    verFinalizados: (req, res) => {
        try {
            const prestamos = PrestamoModel.obtenerFinalizados();
            const config = ConfigModel.obtener();

            res.render('prestamos/finalizados', {
                title: 'Préstamos Finalizados',
                prestamos,
                empresa: config || { moneda: '$' }
            });
        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al cargar el historial');
            res.redirect('/prestamos');
        }
    },

    // 11. API: Detalle completo de un préstamo (JSON)
    detalleJson: (req, res) => {
        try {
            const { id } = req.params;
            const prestamo = PrestamoModel.obtenerDetalle(id);
            if (!prestamo) {
                return res.status(404).json({ error: 'Préstamo no encontrado' });
            }
            const config = ConfigModel.obtener();
            res.json({ prestamo, moneda: (config && config.moneda) || 'Bs.' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener detalle' });
        }
    }
};

module.exports = prestamosController;