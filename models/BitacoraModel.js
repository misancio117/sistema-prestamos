const db = require('../config/database');

class BitacoraModel {

    // Inicializar: asegurar que la tabla existe (ya está en schema.sql, esta es una verificación de seguridad)
    static inicializar() {
        try {
            db.exec(`
                CREATE TABLE IF NOT EXISTS bitacora (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    usuario TEXT NOT NULL DEFAULT 'Sistema',
                    accion TEXT NOT NULL DEFAULT '',
                    detalle TEXT,
                    ip TEXT,
                    fecha DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('✅ Tabla bitácora OK');
        } catch (e) {
            console.error('Error con tabla bitácora:', e.message);
        }
    }

    // 1. Obtener últimos registros
    static obtenerUltimos(limite = 100) {
        try {
            return db.prepare('SELECT * FROM bitacora ORDER BY id DESC LIMIT ?').all(limite);
        } catch (error) {
            console.error('Error obteniendo bitácora:', error.message);
            return [];
        }
    }

    // 2. Registrar nueva acción
    static registrar(usuario, accion, detalle) {
        try {
            const userFinal = usuario || 'Sistema';
            db.prepare("INSERT INTO bitacora (usuario, accion, detalle, fecha) VALUES (?, ?, ?, datetime('now', 'localtime'))").run(userFinal, accion, detalle);
            return true;
        } catch (error) {
            console.error('Error registrando en bitácora:', error.message);
            return false;
        }
    }
}

module.exports = BitacoraModel;