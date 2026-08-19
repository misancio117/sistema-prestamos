const ConfigModel = require('../models/ConfigModel');
const UsuarioModel = require('../models/UsuarioModel');
const bcrypt = require('bcryptjs');
const db = require('../config/database');

const configController = {

    // Mostrar formulario de configuración
    mostrar: (req, res) => {
        try {
            const config = ConfigModel.obtener();
            res.render('config/index', { title: 'Configuración de Empresa', config });
        } catch (error) {
            console.error(error);
            res.redirect('/');
        }
    },

    // Guardar cambios
    actualizar: (req, res) => {
        try {
            const { nombre_empresa, ruc, direccion, telefono, email_contacto, moneda } = req.body;
            const logo = req.file ? req.file.filename : null;

            ConfigModel.actualizar({ nombre_empresa, ruc, direccion, telefono, email_contacto, moneda, logo });

            req.flash('mensajeExito', 'Configuración actualizada correctamente');
            res.redirect('/config');

        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al actualizar configuración');
            res.redirect('/config');
        }
    },

    // Limpiar toda la base de datos — bcrypt.compare es async
    limpiarBD: async (req, res) => {
        try {
            const { password_admin, seguridad_gato } = req.body;
            
            if (!seguridad_gato || seguridad_gato.trim().toLowerCase() !== 'mango') {
                req.flash('mensajeError', 'Respuesta de seguridad incorrecta. Restablecimiento denegado.');
                return res.redirect('/config');
            }

            const adminId = req.session.usuario.id;
            const admin = UsuarioModel.buscarPorId(adminId);
            if (!admin) {
                req.flash('mensajeError', 'Usuario administrador no encontrado');
                return res.redirect('/config');
            }

            const authOk = await bcrypt.compare(password_admin, admin.password);
            if (!authOk) {
                req.flash('mensajeError', 'Contraseña de administrador incorrecta. Se deniega la limpieza de BD.');
                return res.redirect('/config');
            }

            // SQLite: usar DELETE FROM en lugar de TRUNCATE
            // Desactivar FK, limpiar en orden (hijos primero), reactivar FK
            const limpiarTodo = db.transaction(() => {
                db.pragma('foreign_keys = OFF');
                const tablas = ['pagos', 'prestamos', 'empenos', 'gastos', 'bitacora', 'movimientos_ahorro', 'cuentas_ahorro', 'clientes'];
                for (const tabla of tablas) {
                    try { db.prepare(`DELETE FROM ${tabla}`).run(); } catch (e) {
                        console.log(`Tabla ${tabla} no pudo ser vaciada:`, e.message);
                    }
                }
                // Reiniciar Bóveda
                db.prepare('UPDATE boveda SET saldo_actual = 0, capital_invertido = 0 WHERE id = 1').run();
                db.pragma('foreign_keys = ON');
            });

            limpiarTodo();

            req.flash('mensajeExito', '¡Cuidado! La base de datos se ha limpiado exitosamente y ha regresado a sus valores de fábrica.');
            res.redirect('/config');

        } catch (error) {
            console.error("Error al limpiar BD:", error);
            req.flash('mensajeError', 'Error crítico al intentar limpiar la base de datos.');
            res.redirect('/config');
        }
    }
};

module.exports = configController;