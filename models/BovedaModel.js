const db = require('../config/database');

class BovedaModel {
    static inicializar() {
        try {
            db.exec(`
                CREATE TABLE IF NOT EXISTS boveda (
                    id INTEGER PRIMARY KEY DEFAULT 1,
                    saldo_actual REAL NOT NULL DEFAULT 0.00,
                    capital_invertido REAL NOT NULL DEFAULT 0.00
                )
            `);

            const row = db.prepare('SELECT * FROM boveda WHERE id = 1').get();
            if (!row) {
                db.prepare('INSERT INTO boveda (id, saldo_actual, capital_invertido) VALUES (1, 0.00, 0.00)').run();
            }
        } catch (error) {
            console.error('Error inicializando bóveda:', error);
        }
    }

    // Obtener los datos actuales de la bóveda
    static obtener() {
        return db.prepare('SELECT * FROM boveda WHERE id = 1').get();
    }

    // Inyectar Capital Inicial o Adicional
    static inyectarCapital(monto) {
        db.prepare('UPDATE boveda SET saldo_actual = saldo_actual + ?, capital_invertido = capital_invertido + ? WHERE id = 1').run(monto, monto);
    }

    // Sumar ganancias o devoluciones
    static sumarSaldo(monto) {
        db.prepare('UPDATE boveda SET saldo_actual = saldo_actual + ? WHERE id = 1').run(monto);
    }

    // Restar salida de capital
    static restarSaldo(monto) {
        db.prepare('UPDATE boveda SET saldo_actual = saldo_actual - ? WHERE id = 1').run(monto);
    }
}

// Inicializar automáticamente al cargar el módulo
BovedaModel.inicializar();

module.exports = BovedaModel;
