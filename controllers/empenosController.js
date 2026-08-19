const EmpenoModel = require('../models/EmpenoModel');
const ClienteModel = require('../models/ClienteModel');
const ConfigModel = require('../models/ConfigModel');
const db = require('../config/database');

const empenosController = {

    listar: (req, res) => {
        try {
            const { estado, q } = req.query;
            let empenos;

            if (q && q.trim()) {
                empenos = EmpenoModel.obtenerPorBusqueda(q.trim());
            } else if (estado && estado !== 'todos') {
                if (estado === 'devuelto') {
                    empenos = EmpenoModel.obtenerPorEstados(['devuelto', 'retirado']);
                } else {
                    empenos = EmpenoModel.obtenerPorEstado(estado);
                }
            } else {
                empenos = EmpenoModel.obtenerTodos();
            }

            const config = ConfigModel.obtener();
            const filtroActual = estado || 'todos';

            res.render('empenos/index', { 
                title: 'Empeños y Garantías',
                empenos,
                empresa: config || { moneda: '$' },
                filtroActual,
                busqueda: q || ''
            });
        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al cargar los empeños');
            res.redirect('/');
        }
    },

    mostrarFormulario: (req, res) => {
        try {
            const clientes = ClienteModel.obtenerTodos();
            const config = ConfigModel.obtener();

            res.render('empenos/crear', { 
                title: 'Nuevo Empeño',
                clientes,
                empresa: config || { moneda: '$' }
            });
        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al cargar formulario');
            res.redirect('/empenos');
        }
    },

    guardar: (req, res) => {
        const { cliente_id, nombre_articulo, descripcion, valor_tasacion, monto_prestado, fecha_limite } = req.body;
        const imagen = req.file ? req.file.filename : null;

        if (!cliente_id || !nombre_articulo || !monto_prestado) {
            req.flash('mensajeError', 'Complete los campos obligatorios');
            return res.redirect('/empenos/crear');
        }

        try {
            EmpenoModel.crear({ cliente_id, nombre_articulo, descripcion, valor_tasacion, monto_prestado, fecha_limite, imagen });
            req.flash('mensajeExito', 'Artículo registrado en garantía');
            res.redirect('/empenos');
        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al guardar empeño');
            res.redirect('/empenos/crear');
        }
    },

    liberar: (req, res) => {
        const { id } = req.params;
        try {
            const empenoAsignado = db.prepare('SELECT prestamo_id FROM empenos WHERE id = ?').get(id);
            if (empenoAsignado && empenoAsignado.prestamo_id) {
                const PrestamoModel = require('../models/PrestamoModel');
                const prestamoObj = PrestamoModel.obtenerPorId(empenoAsignado.prestamo_id);
                if (prestamoObj && prestamoObj.estado !== 'pagado') {
                    req.flash('mensajeError', 'No se puede devolver la garantía porque el cliente aún no ha liquidado este préstamo en su totalidad.');
                    return res.redirect('/empenos');
                }
            }

            EmpenoModel.cambiarEstado(id, 'devuelto');
            EmpenoModel.actualizarEstadoGarantia(id, 'devuelto');
            req.flash('mensajeExito', 'Garantía marcada como devuelta al cliente exitosamente.');
            res.redirect('/empenos');
        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al liberar artículo');
            res.redirect('/empenos');
        }
    }
};

module.exports = empenosController;
