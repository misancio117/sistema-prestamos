const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Usar APP_DATA_PATH si estamos en Electron empaquetado, de lo contrario __dirname
const basePath = process.env.APP_DATA_PATH || path.join(__dirname, '..');
const dbDir = path.join(basePath, 'database');

if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'database.db');

// Abrir (o crear) la base de datos
const db = new Database(dbPath);

// Optimizaciones SQLite
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Migraciones rápidas
try {
    db.exec("ALTER TABLE prestamos ADD COLUMN motivo_finalizacion TEXT DEFAULT NULL;");
} catch (e) {
    // La columna ya existe
}
try {
    db.exec("ALTER TABLE prestamos ADD COLUMN fecha_primer_cobro TEXT DEFAULT NULL;");
} catch (e) {
    // La columna ya existe
}
try {
    db.exec("ALTER TABLE empenos ADD COLUMN estado_garantia TEXT DEFAULT NULL;");
} catch (e) {
    // La columna ya existe
}

// Migrar estado retirado → devuelto (unificación de estados)
try {
    const result = db.prepare("UPDATE empenos SET estado = 'devuelto' WHERE estado = 'retirado'").run();
    if (result.changes > 0) {
        console.log(`→ Migrados ${result.changes} empeños de 'retirado' a 'devuelto'`);
    }
} catch (e) {
    console.error('Error en migración retirado→devuelto:', e.message);
}

console.log('✅ Conectado exitosamente a la Base de Datos SQLite');

module.exports = db;
