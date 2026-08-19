const ClienteModel = require('../models/ClienteModel');
const PrestamoModel = require('../models/PrestamoModel');
const EmpenoModel = require('../models/EmpenoModel');
const AhorroModel = require('../models/AhorroModel');
const ConfigModel = require('../models/ConfigModel');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const clientesController = {

    // 1. Listar
    listar: (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = 5;
            const offset = (page - 1) * limit;
            const busqueda = req.query.q || '';

            let clientes, totalRegistros;

            if (busqueda) {
                clientes = ClienteModel.buscarPaginados(busqueda, limit, offset);
                totalRegistros = ClienteModel.contarBusqueda(busqueda);
            } else {
                clientes = ClienteModel.obtenerPaginados(limit, offset);
                totalRegistros = ClienteModel.contarTotal();
            }

            const totalPages = Math.ceil(totalRegistros / limit);

            res.render('clientes/index', { 
                title: 'Gestión de Clientes',
                clientes,
                busqueda,
                currentPage: page,
                totalPages,
                totalRegistros
            });

        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al obtener los clientes');
            res.redirect('/');
        }
    },

    // 2. Formulario Crear
    mostrarFormulario: (req, res) => {
        res.render('clientes/crear', { title: 'Nuevo Cliente' });
    },

    // 3. Guardar Cliente
    guardar: (req, res) => {
        const dni      = (req.body.dni      || '').trim();
        const nombre   = (req.body.nombre   || '').trim();
        const apellido = (req.body.apellido || '').trim();
        const telefono = (req.body.telefono || '').trim();
        const direccion = (req.body.direccion || '').trim();
        const email    = (req.body.email    || '').trim();
        const foto = req.file ? req.file.filename : null;

        if (!dni || !nombre || !apellido) {
            req.flash('mensajeError', 'DNI, Nombre y Apellido son obligatorios');
            return res.redirect('/clientes/crear');
        }

        if (email && !EMAIL_REGEX.test(email)) {
            req.flash('mensajeError', 'El formato del correo electrónico no es válido');
            return res.redirect('/clientes/crear');
        }

        try {
            const existe = ClienteModel.buscarPorDNI(dni);
            if (existe) {
                req.flash('mensajeError', 'El cliente con ese DNI ya existe');
                return res.redirect('/clientes/crear');
            }

            ClienteModel.crear({ dni, nombre, apellido, telefono, direccion, email: email || null, foto });
            req.flash('mensajeExito', 'Cliente registrado correctamente');
            res.redirect('/clientes');

        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al guardar el cliente');
            res.redirect('/clientes/crear');
        }
    },

    // 4. Ver Perfil
    verPerfil: (req, res) => {
        const { id } = req.params;
        try {
            const cliente = ClienteModel.obtenerPorId(id);
            
            if (!cliente) {
                req.flash('mensajeError', 'Cliente no encontrado');
                return res.redirect('/clientes');
            }

            const prestamos = PrestamoModel.obtenerPorCliente(id);
            const empenos = EmpenoModel.obtenerPorCliente(id);
            const cuentaAhorro = AhorroModel.buscarPorCliente(id);
            const config = ConfigModel.obtener();
            const empresaConfig = config || { moneda: '$' };

            res.render('clientes/perfil', {
                title: `Perfil de ${cliente.nombre}`,
                cliente,
                prestamos,
                empenos,
                cuentaAhorro,
                empresa: empresaConfig
            });

        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al cargar perfil');
            res.redirect('/clientes');
        }
    },

    // 5. Mostrar Edición
    mostrarEdicion: (req, res) => {
        const { id } = req.params;
        try {
            const cliente = ClienteModel.obtenerPorId(id);
            if (!cliente) {
                req.flash('mensajeError', 'Cliente no encontrado');
                return res.redirect('/clientes');
            }
            res.render('clientes/editar', { title: 'Editar Cliente', cliente });
        } catch (error) {
            console.error(error);
            res.redirect('/clientes');
        }
    },

    // 6. Búsqueda AJAX para autocomplete
    buscarAutocomplete: (req, res) => {
        try {
            const q = (req.query.q || '').trim();
            if (q.length < 1) return res.json([]);
            const clientes = ClienteModel.buscarPaginados(q, 10, 0);
            res.json(clientes);
        } catch (error) {
            console.error(error);
            res.status(500).json([]);
        }
    },

    // 7. Procesar Edición
    actualizar: (req, res) => {
        const { id } = req.params;
        const dni      = (req.body.dni      || '').trim();
        const nombre   = (req.body.nombre   || '').trim();
        const apellido = (req.body.apellido || '').trim();
        const telefono = (req.body.telefono || '').trim();
        const direccion = (req.body.direccion || '').trim();
        const email    = (req.body.email    || '').trim();
        const foto = req.file ? req.file.filename : null;

        if (!dni || !nombre || !apellido) {
            req.flash('mensajeError', 'DNI, Nombre y Apellido son obligatorios');
            return res.redirect(`/clientes/editar/${id}`);
        }

        if (email && !EMAIL_REGEX.test(email)) {
            req.flash('mensajeError', 'El formato del correo electrónico no es válido');
            return res.redirect(`/clientes/editar/${id}`);
        }

        try {
            ClienteModel.actualizar(id, { dni, nombre, apellido, telefono, direccion, email: email || null, foto });
            req.flash('mensajeExito', 'Datos del cliente actualizados');
            res.redirect('/clientes');
        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al actualizar');
            res.redirect(`/clientes/editar/${id}`);
        }
    }
};

module.exports = clientesController;