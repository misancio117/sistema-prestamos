const db = require('../config/database');

class PagoModel {

    // 1. Registrar un pago
    static crear(datos) {
        const { prestamo_id, monto_pagado, observaciones } = datos;
        const query = `
            INSERT INTO pagos (prestamo_id, monto_pagado, observaciones) 
            VALUES (?, ?, ?)
        `;
        return db.prepare(query).run(prestamo_id, monto_pagado, observaciones);
    }

    // 2. Obtener el total pagado de un préstamo
    static obtenerTotalPagado(prestamoId) {
        const row = db.prepare('SELECT SUM(monto_pagado) as total FROM pagos WHERE prestamo_id = ?').get(prestamoId);
        return row.total || 0;
    }

    // 3. Obtener historial de pagos
    static obtenerHistorial(prestamoId) {
        return db.prepare('SELECT * FROM pagos WHERE prestamo_id = ? ORDER BY fecha_pago DESC').all(prestamoId);
    }

    // 4. Obtener detalle completo
    static obtenerDetalle(pagoId) {
        const query = `
            SELECT
                pg.id as pago_id, pg.monto_pagado, pg.fecha_pago, pg.observaciones,
                pr.id as prestamo_id, pr.monto_total as deuda_total,
                c.nombre, c.apellido, c.dni, c.email
            FROM pagos pg
            INNER JOIN prestamos pr ON pg.prestamo_id = pr.id
            INNER JOIN clientes c ON pr.cliente_id = c.id
            WHERE pg.id = ?
        `;
        return db.prepare(query).get(pagoId);
    }

    // 5. Crear pago y sumar a bóveda en una sola transacción atómica
    static crearConSumarBoveda(datos) {
        const { prestamo_id, monto_pagado, observaciones } = datos;

        const stmtPago = db.prepare(
            'INSERT INTO pagos (prestamo_id, monto_pagado, observaciones) VALUES (?, ?, ?)'
        );
        const stmtBoveda = db.prepare(
            'UPDATE boveda SET saldo_actual = saldo_actual + ? WHERE id = 1'
        );

        return db.transaction(() => {
            const result = stmtPago.run(prestamo_id, monto_pagado, observaciones);
            stmtBoveda.run(monto_pagado);
            return result;
        })();
    }
}

module.exports = PagoModel;