const path = require('path');
const fs = require('fs');

const backupController = {

    // Generar y descargar copia de seguridad del archivo .db de SQLite
    descargar: (req, res) => {
        const fecha = new Date().toISOString().split('T')[0];
        const fileName = `backup_sistema_${fecha}_${Date.now()}.db`;
        const dbPath = path.join(__dirname, '../database/database.db');

        if (!fs.existsSync(dbPath)) {
            req.flash('mensajeError', 'No se encontró el archivo de base de datos.');
            return res.redirect('/config');
        }

        res.download(dbPath, fileName, (err) => {
            if (err) {
                console.error('Error en descarga del backup:', err);
                req.flash('mensajeError', 'Error al descargar el respaldo.');
                res.redirect('/config');
            }
        });
    }
};

module.exports = backupController;