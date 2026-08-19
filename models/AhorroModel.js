const db = require('../config/database');

class AhorroModel {

    // Inicializar: agregar columnas si no existen (SQLite pragma table_info)
    static inicializar() {
        try {
            const cols = db.prepare("PRAGMA table_info(cuentas_ahorro)").all();
            const existentes = cols.map(c => c.name);

            if (!existentes.includes('tasa_interes')) {
                db.exec("ALTER TABLE cuentas_ahorro ADD COLUMN tasa_interes REAL DEFAULT 0.00");
            }
            if (!existentes.includes('plazo_meses')) {
                db.exec("ALTER TABLE cuentas_ahorro ADD COLUMN plazo_meses INTEGER DEFAULT 0");
            }
            console.log('✅ Migración ahorros completada');
        } catch (e) { console.error('Error migración ahorros:', e.message); }
    }

    // 1. Listar todas las cuentas
    static obtenerTodas() {
        const query = `
            SELECT a.*, c.nombre, c.apellido, c.dni 
            FROM cuentas_ahorro a
            INNER JOIN clientes c ON a.cliente_id = c.id
            ORDER BY a.saldo_actual DESC
        `;
        return db.prepare(query).all();
    }

    // 2. Buscar por Cliente
    static buscarPorCliente(clienteId) {
        return db.prepare('SELECT * FROM cuentas_ahorro WHERE cliente_id = ?').get(clienteId);
    }

    // 3. Obtener por ID de Cuenta
    static obtenerPorId(id) {
        const query = `
            SELECT a.*, c.nombre, c.apellido, c.email, c.dni 
            FROM cuentas_ahorro a
            INNER JOIN clientes c ON a.cliente_id = c.id
            WHERE a.id = ?
        `;
        return db.prepare(query).get(id);
    }

    // 4. Crear Cuenta (con interés y plazo)
    static crear(clienteId, tasaInteres = 0, plazoMeses = 0) {
        const query = "INSERT INTO cuentas_ahorro (cliente_id, saldo_actual, tasa_interes, plazo_meses, fecha_apertura) VALUES (?, 0.00, ?, ?, date('now', 'localtime'))";
        return db.prepare(query).run(clienteId, tasaInteres, plazoMeses);
    }

    // 5. Registrar Movimiento (con transacción atómica de better-sqlite3)
    static registrarMovimiento(cuentaId, tipo, monto, observacion) {
        const transaccion = db.transaction(() => {
            db.prepare(
                'INSERT INTO movimientos_ahorro (cuenta_id, tipo_movimiento, monto, observacion) VALUES (?, ?, ?, ?)'
            ).run(cuentaId, tipo, monto, observacion);

            if (tipo === 'deposito') {
                db.prepare('UPDATE cuentas_ahorro SET saldo_actual = saldo_actual + ? WHERE id = ?').run(monto, cuentaId);
            } else {
                db.prepare('UPDATE cuentas_ahorro SET saldo_actual = saldo_actual - ? WHERE id = ?').run(monto, cuentaId);
            }
        });

        transaccion(); // Ejecuta la transacción
        return true;
    }

    // 6. Historial
    static obtenerMovimientos(cuentaId) {
        return db.prepare('SELECT * FROM movimientos_ahorro WHERE cuenta_id = ? ORDER BY fecha_movimiento DESC').all(cuentaId);
    }

    // 7. Obtener Movimiento Específico (Para el Voucher)
    static obtenerMovimientoPorId(movimientoId) {
        const query = `
            SELECT 
                m.id as mov_id, m.tipo_movimiento, m.monto, m.fecha_movimiento, m.observacion,
                c.id as cuenta_id, cl.nombre, cl.apellido, cl.dni
            FROM movimientos_ahorro m
            INNER JOIN cuentas_ahorro c ON m.cuenta_id = c.id
            INNER JOIN clientes cl ON c.cliente_id = cl.id
            WHERE m.id = ?
        `;
        return db.prepare(query).get(movimientoId);
    }
}

module.exports = AhorroModel;