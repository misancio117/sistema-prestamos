const db = require('../config/database');

class CajaModel {

    // 1. Total Cobrado (Ingresos por Préstamos)
    static totalPagos(fecha) {
        const row = db.prepare('SELECT SUM(monto_pagado) as total FROM pagos WHERE DATE(fecha_pago) = ?').get(fecha);
        return row.total || 0;
    }

    // 2. Total Prestado (Egresos por Préstamos Nuevos)
    static totalPrestamosEntregados(fecha) {
        const row = db.prepare('SELECT SUM(monto_prestado) as total FROM prestamos WHERE DATE(fecha_inicio) = ?').get(fecha);
        return row.total || 0;
    }

    // 3. Total Gastos (Egresos Operativos)
    static totalGastos(fecha) {
        const row = db.prepare('SELECT SUM(monto) as total FROM gastos WHERE DATE(fecha_gasto) = ?').get(fecha);
        return row.total || 0;
    }

    // 4. Total Ahorros (Ingresos por Depósito o Egresos por Retiro)
    static totalAhorros(fecha, tipo) {
        const query = `
            SELECT SUM(monto) as total 
            FROM movimientos_ahorro 
            WHERE DATE(fecha_movimiento) = ? AND tipo_movimiento = ?
        `;
        const row = db.prepare(query).get(fecha, tipo);
        return row.total || 0;
    }
}

module.exports = CajaModel;