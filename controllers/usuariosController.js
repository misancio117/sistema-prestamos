const UsuarioModel = require('../models/UsuarioModel');
const bcrypt = require('bcryptjs');
const { ROLES_VALIDOS } = require('../utils/constants');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const usuariosController = {

    // Listar usuarios
    listar: (req, res) => {
        try {
            const usuarios = UsuarioModel.obtenerTodos();
            res.render('usuarios/index', { title: 'Gestión de Personal', usuarios });
        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al cargar usuarios');
            res.redirect('/');
        }
    },

    // Formulario de creación
    mostrarFormulario: (req, res) => {
        res.render('usuarios/crear', { title: 'Nuevo Usuario' });
    },

    // Guardar nuevo usuario — bcrypt.hash es async, se mantiene
    guardar: async (req, res) => {
        const { nombre_completo, email, password, rol } = req.body;

        try {
            // --- Validaciones ---
            if (!nombre_completo || !nombre_completo.trim() || !email || !password || !rol) {
                req.flash('mensajeError', 'Todos los campos son obligatorios.');
                return res.redirect('/usuarios/crear');
            }

            if (!EMAIL_REGEX.test(email.trim())) {
                req.flash('mensajeError', 'El formato del correo electrónico no es válido.');
                return res.redirect('/usuarios/crear');
            }

            if (password.length < 8) {
                req.flash('mensajeError', 'La contraseña debe tener al menos 8 caracteres.');
                return res.redirect('/usuarios/crear');
            }

            if (!ROLES_VALIDOS.includes(rol)) {
                req.flash('mensajeError', 'Rol no válido.');
                return res.redirect('/usuarios/crear');
            }
            // --- Fin validaciones ---

            const existe = UsuarioModel.buscarPorEmail(email.trim());
            if (existe) {
                req.flash('mensajeError', 'El correo electrónico ya está registrado.');
                return res.redirect('/usuarios/crear');
            }

            const passwordHash = await bcrypt.hash(password, 10);
            UsuarioModel.crear({ nombre_completo: nombre_completo.trim(), email: email.trim(), password: passwordHash, rol });

            req.flash('mensajeExito', 'Usuario creado correctamente.');
            res.redirect('/usuarios');

        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al crear usuario.');
            res.redirect('/usuarios/crear');
        }
    },

    // Eliminar usuario
    eliminar: (req, res) => {
        const { id } = req.params;
        
        if (req.session.usuario.id == id) {
            req.flash('mensajeError', 'No puedes eliminar tu propia cuenta mientras estás logueado.');
            return res.redirect('/usuarios');
        }

        try {
            UsuarioModel.eliminar(id);
            req.flash('mensajeExito', 'Usuario eliminado.');
            res.redirect('/usuarios');
        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al eliminar.');
            res.redirect('/usuarios');
        }
    }
};

module.exports = usuariosController;