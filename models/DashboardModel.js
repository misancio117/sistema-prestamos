const db = require('../config/database');

class DashboardModel {
    
    // 1. Obtener totales generales precisos
    static obtenerTotales() {
        const clientesDeuda = db.prepare("SELECT COUNT(DISTINCT cliente_id) as total FROM prestamos WHERE estado IN ('pendiente', 'vencido')").get();
        const boveda = db.prepare("SELECT * FROM boveda WHERE id = 1").get();
        const capitalPrestado = db.prepare("SELECT SUM(monto_prestado) as total FROM prestamos WHERE estado IN ('pendiente', 'vencido')").get();
        const ganancias = db.prepare("SELECT SUM(monto_total - monto_prestado) as total FROM prestamos WHERE estado != 'finalizado'").get();

        return {
            clientes_con_deuda: clientesDeuda.total || 0,
            capital_disponible: boveda ? parseFloat(boveda.saldo_actual) : 0.00,
            capital_prestado: capitalPrestado.total || 0.00,
            ganancias: ganancias.total || 0.00
        };
    }

    // 2. Obtener datos para Gráficos
    static obtenerDatosGraficos() {
        return db.prepare('SELECT estado, COUNT(*) as cantidad FROM prestamos GROUP BY estado').all();
    }
}

module.exports = DashboardModel;