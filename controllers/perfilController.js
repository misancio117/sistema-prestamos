const UsuarioModel = require('../models/UsuarioModel');
const bcrypt = require('bcryptjs');

const perfilController = {

    // Mostrar vista de perfil
    mostrar: (req, res) => {
        try {
            const usuario = UsuarioModel.buscarPorId(req.session.usuario.id);
            res.render('perfil/index', { title: 'Mi Perfil', usuarioData: usuario });
        } catch (error) {
            console.error(error);
            res.redirect('/');
        }
    },

    // Actualizar Nombre y Correo
    actualizarDatos: (req, res) => {
        const { nombre_completo, email } = req.body;
        const idUsuario = req.session.usuario.id;

        try {
            UsuarioModel.actualizarDatos(idUsuario, nombre_completo, email);
            req.session.usuario.nombre = nombre_completo;
            req.session.usuario.email = email;

            req.flash('mensajeExito', 'Datos actualizados correctamente');
            res.redirect('/perfil');

        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al actualizar datos');
            res.redirect('/perfil');
        }
    },

    // Cambiar Contraseña — bcrypt es async, se mantiene
    cambiarPassword: async (req, res) => {
        const { password_actual, password_nueva, password_confirmar } = req.body;
        const idUsuario = req.session.usuario.id;

        try {
            if (!password_actual || !password_nueva || !password_confirmar) {
                req.flash('mensajeError', 'Todos los campos de contraseña son obligatorios');
                return res.redirect('/perfil');
            }

            if (password_nueva.length < 8) {
                req.flash('mensajeError', 'La nueva contraseña debe tener al menos 8 caracteres');
                return res.redirect('/perfil');
            }

            if (password_nueva !== password_confirmar) {
                req.flash('mensajeError', 'Las nuevas contraseñas no coinciden');
                return res.redirect('/perfil');
            }

            const usuario = UsuarioModel.buscarPorId(idUsuario);
            const esValido = await bcrypt.compare(password_actual, usuario.password);
            if (!esValido) {
                req.flash('mensajeError', 'La contraseña actual es incorrecta');
                return res.redirect('/perfil');
            }

            const passwordHash = await bcrypt.hash(password_nueva, 10);
            UsuarioModel.actualizarPassword(idUsuario, passwordHash);

            req.flash('mensajeExito', 'Contraseña cambiada exitosamente. Inicia sesión de nuevo.');
            req.session.destroy(() => {
                res.redirect('/auth/login');
            });

        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al cambiar contraseña');
            res.redirect('/perfil');
        }
    }
};

module.exports = perfilController;