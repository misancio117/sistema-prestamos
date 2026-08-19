const UsuarioModel = require('../models/UsuarioModel');
const bcrypt = require('bcryptjs');

const authController = {
    
    // Mostrar formulario de Login
    mostrarLogin: (req, res) => {
        if (req.session.usuario) {
            return res.redirect('/');
        }
        res.render('login', { layout: false });
    },

    // Procesar Login — bcrypt.compare sigue siendo async
    login: async (req, res) => {
        const { email, password } = req.body;

        try {
            // 1. Buscar usuario (síncrono)
            const usuario = UsuarioModel.buscarPorEmail(email);

            if (!usuario) {
                req.flash('mensajeError', 'Usuario o contraseña incorrectos');
                return res.redirect('/auth/login');
            }

            // 2. Verificar contraseña (bcrypt es async, lo mantenemos)
            const passwordValido = await bcrypt.compare(password, usuario.password);

            if (!passwordValido) {
                req.flash('mensajeError', 'Usuario o contraseña incorrectos');
                return res.redirect('/auth/login');
            }

            // 3. Crear Sesión (regenerar ID para evitar session fixation)
            const datosUsuario = {
                id: usuario.id,
                nombre: usuario.nombre_completo,
                email: usuario.email,
                rol: usuario.rol
            };

            req.session.regenerate((err) => {
                if (err) {
                    console.error('Error regenerando sesión:', err);
                    req.flash('mensajeError', 'Error en el servidor');
                    return res.redirect('/auth/login');
                }
                req.session.usuario = datosUsuario;
                res.redirect('/');
            });

        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error en el servidor');
            res.redirect('/auth/login');
        }
    },

    // Cerrar Sesión
    logout: (req, res) => {
        req.session.destroy(() => {
            res.redirect('/auth/login');
        });
    }
};

module.exports = authController;