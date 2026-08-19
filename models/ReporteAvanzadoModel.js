const db = require('../config/database');

class ReporteAvanzadoModel {

    static prestamosPorFecha(desde, hasta) {
        return db.prepare(`
            SELECT p.id, c.nombre, c.apellido, c.dni, p.monto_prestado, p.monto_total,
                   p.tasa_interes, p.cuotas, p.frecuencia, p.fecha_inicio, p.estado
            FROM prestamos p
            INNER JOIN clientes c ON p.cliente_id = c.id
            WHERE p.fecha_inicio >= ? AND p.fecha_inicio <= ?
            ORDER BY p.fecha_inicio DESC
        `).all(desde, hasta);
    }

    static pagosPorFecha(desde, hasta) {
        return db.prepare(`
            SELECT pg.id, pg.monto_pagado, pg.fecha_pago, pg.observaciones,
                   c.nombre, c.apellido, p.id AS prestamo_id
            FROM pagos pg
            INNER JOIN prestamos p ON pg.prestamo_id = p.id
            INNER JOIN clientes c ON p.cliente_id = c.id
            WHERE pg.fecha_pago >= ? AND pg.fecha_pago <= ?
            ORDER BY pg.fecha_pago DESC
        `).all(desde + ' 00:00:00', hasta + ' 23:59:59');
    }

    static gastosPorFecha(desde, hasta) {
        return db.prepare(`
            SELECT * FROM gastos
            WHERE fecha_gasto >= ? AND fecha_gasto <= ?
            ORDER BY fecha_gasto DESC
        `).all(desde, hasta);
    }

    static carteraVencida() {
        return db.prepare(`
            SELECT p.id, c.nombre, c.apellido, c.dni, c.telefono,
                   p.monto_prestado, p.monto_total, p.fecha_inicio, p.fecha_fin,
                   p.cuotas, p.frecuencia,
                   COALESCE((SELECT SUM(pg.monto_pagado) FROM pagos pg WHERE pg.prestamo_id = p.id), 0) AS total_pagado,
                   p.monto_total - COALESCE((SELECT SUM(pg.monto_pagado) FROM pagos pg WHERE pg.prestamo_id = p.id), 0) AS saldo_pendiente,
                   CAST(julianday('now') - julianday(p.fecha_fin) AS INTEGER) AS dias_mora
            FROM prestamos p
            INNER JOIN clientes c ON p.cliente_id = c.id
            WHERE p.estado = 'vencido'
            ORDER BY dias_mora DESC
        `).all();
    }

    static empenosPorFecha(desde, hasta) {
        return db.prepare(`
            SELECT e.id, e.nombre_articulo, e.descripcion, e.valor_tasacion, e.monto_prestado,
                   e.fecha_limite, e.estado, e.created_at,
                   c.nombre, c.apellido, c.dni, c.telefono
            FROM empenos e
            INNER JOIN clientes c ON e.cliente_id = c.id
            WHERE date(e.created_at) >= ? AND date(e.created_at) <= ?
            ORDER BY e.created_at DESC
        `).all(desde, hasta);
    }

    static ahorrosPorFecha(desde, hasta) {
        return db.prepare(`
            SELECT ma.id, ma.tipo_movimiento, ma.monto, ma.fecha_movimiento, ma.observacion,
                   ca.id AS cuenta_id, c.nombre, c.apellido, c.dni
            FROM movimientos_ahorro ma
            INNER JOIN cuentas_ahorro ca ON ma.cuenta_id = ca.id
            INNER JOIN clientes c ON ca.cliente_id = c.id
            WHERE ma.fecha_movimiento >= ? AND ma.fecha_movimiento <= ?
            ORDER BY ma.fecha_movimiento DESC
        `).all(desde + ' 00:00:00', hasta + ' 23:59:59');
    }

    static rentabilidadPorFecha(desde, hasta) {
        const cobros = db.prepare(`
            SELECT COALESCE(SUM(monto_pagado), 0) AS total, COUNT(*) AS cantidad
            FROM pagos WHERE fecha_pago >= ? AND fecha_pago <= ?
        `).get(desde + ' 00:00:00', hasta + ' 23:59:59');

        const gastos = db.prepare(`
            SELECT COALESCE(SUM(monto), 0) AS total, COUNT(*) AS cantidad
            FROM gastos WHERE fecha_gasto >= ? AND fecha_gasto <= ?
        `).get(desde, hasta);

        const prestamos = db.prepare(`
            SELECT COALESCE(SUM(monto_prestado), 0) AS capital,
                   COALESCE(SUM(monto_total - monto_prestado), 0) AS intereses,
                   COUNT(*) AS cantidad
            FROM prestamos WHERE fecha_inicio >= ? AND fecha_inicio <= ?
        `).get(desde, hasta);

        const pagosDetalle = db.prepare(`
            SELECT pg.id, pg.monto_pagado, pg.fecha_pago, c.nombre, c.apellido
            FROM pagos pg
            INNER JOIN prestamos p ON pg.prestamo_id = p.id
            INNER JOIN clientes c ON p.cliente_id = c.id
            WHERE pg.fecha_pago >= ? AND pg.fecha_pago <= ?
            ORDER BY pg.fecha_pago DESC
        `).all(desde + ' 00:00:00', hasta + ' 23:59:59');

        const gastosDetalle = db.prepare(`
            SELECT id, descripcion, categoria, monto, fecha_gasto, registrado_por
            FROM gastos WHERE fecha_gasto >= ? AND fecha_gasto <= ?
            ORDER BY fecha_gasto DESC
        `).all(desde, hasta);

        return {
            totalCobrado:        cobros.total,
            cantidadCobros:      cobros.cantidad,
            totalGastos:         gastos.total,
            cantidadGastos:      gastos.cantidad,
            utilidadNeta:        cobros.total - gastos.total,
            prestamosOtorgados:  prestamos.cantidad,
            capitalDesembolsado: prestamos.capital,
            interesesEsperados:  prestamos.intereses,
            pagosDetalle,
            gastosDetalle
        };
    }
}

module.exports = ReporteAvanzadoModel;
