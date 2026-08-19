const soloAdmin = (req, res, next) => {
    if (req.session.usuario && req.session.usuario.rol === 'admin') {
        return next();
    }
    req.flash('mensajeError', 'Acceso denegado: Solo administradores.');
    return res.redirect('/');
};

module.exports = soloAdmin;
