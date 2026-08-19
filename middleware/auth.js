const protegerRuta = (req, res, next) => {
    // Si existe la sesión de usuario, dejamos pasar (next)
    if (req.session.usuario) {
        return next();
    }
    // Si no, redirigimos al login
    return res.redirect('/auth/login');
};

module.exports = protegerRuta;