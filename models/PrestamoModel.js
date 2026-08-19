const db = require('../config/database');

class PrestamoModel {

    // 1. Obtener paginados
    static obtenerPaginados(limit, offset) {
        const query = `
            SELECT p.*, c.nombre, c.apellido, c.dni, c.telefono,
                   e.nombre_articulo, e.id AS empeno_id
            FROM prestamos p
            INNER JOIN clientes c ON p.cliente_id = c.id
            LEFT JOIN empenos e ON e.prestamo_id = p.id
            WHERE p.estado IN ('pendiente', 'vencido')
            ORDER BY CASE WHEN p.estado = 'vencido' THEN 1 ELSE 0 END DESC, p.fecha_fin ASC
            LIMIT ? OFFSET ?
        `;
        return db.prepare(query).all(limit, offset);
    }

    // 2. Contar total
    static contarTotal() {
        const row = db.prepare("SELECT COUNT(*) as total FROM prestamos WHERE estado IN ('pendiente', 'vencido')").get();
        return row.total;
    }

    // 3. Buscar paginados
    static buscarPaginados(criterio, limit, offset) {
        const busqueda = `%${criterio}%`;
        const query = `
            SELECT p.*, c.nombre, c.apellido, c.dni, c.telefono,
                   e.nombre_articulo, e.id AS empeno_id
            FROM prestamos p
            INNER JOIN clientes c ON p.cliente_id = c.id
            LEFT JOIN empenos e ON e.prestamo_id = p.id
            WHERE (c.nombre LIKE ? OR c.apellido LIKE ? OR p.id LIKE ?) 
              AND p.estado IN ('pendiente', 'vencido')
            ORDER BY CASE WHEN p.estado = 'vencido' THEN 1 ELSE 0 END DESC, p.fecha_fin ASC
            LIMIT ? OFFSET ?
        `;
        return db.prepare(query).all(busqueda, busqueda, busqueda, limit, offset);
    }

    // 4. Contar búsqueda
    static contarBusqueda(criterio) {
        const busqueda = `%${criterio}%`;
        const query = `
            SELECT COUNT(*) as total 
            FROM prestamos p
            INNER JOIN clientes c ON p.cliente_id = c.id
            WHERE (c.nombre LIKE ? OR c.apellido LIKE ? OR p.id LIKE ?)
              AND p.estado IN ('pendiente', 'vencido')
        `;
        const row = db.prepare(query).get(busqueda, busqueda, busqueda);
        return row.total;
    }

    // 5. Crear
    static crear(datos) {
        const { 
            cliente_id, monto_prestado, tasa_interes, 
            monto_total, cuotas, frecuencia, fecha_inicio, fecha_fin, sistema_pago,
            fecha_primer_cobro
        } = datos;
        
        const sys_pago = sistema_pago || 'frances';

        const query = `
            INSERT INTO prestamos 
            (cliente_id, monto_prestado, tasa_interes, monto_total, cuotas, frecuencia, fecha_inicio, fecha_fin, sistema_pago, fecha_primer_cobro) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        return db.prepare(query).run(
            cliente_id, monto_prestado, tasa_interes, 
            monto_total, cuotas, frecuencia, fecha_inicio, fecha_fin, sys_pago,
            fecha_primer_cobro
        );
    }

    // 6. Obtener por ID
    static obtenerPorId(id) {
        const query = `
            SELECT p.*, c.nombre, c.apellido, c.dni, c.email 
            FROM prestamos p
            INNER JOIN clientes c ON p.cliente_id = c.id
            WHERE p.id = ?
        `;
        return db.prepare(query).get(id);
    }

    // 6b. Obtener detalle completo con empeño y pagos
    static obtenerDetalle(id) {
        const prestamo = db.prepare(`
            SELECT p.*, c.nombre, c.apellido, c.dni, c.telefono, c.email, c.direccion,
                   e.nombre_articulo, e.descripcion AS empeno_descripcion, e.valor_tasacion, e.estado AS empeno_estado
            FROM prestamos p
            INNER JOIN clientes c ON p.cliente_id = c.id
            LEFT JOIN empenos e ON e.prestamo_id = p.id
            WHERE p.id = ?
        `).get(id);

        if (!prestamo) return null;

        const PagoModel = require('./PagoModel');
        prestamo.pagos = PagoModel.obtenerHistorial(id);
        prestamo.totalPagado = PagoModel.obtenerTotalPagado(id);

        if (!prestamo.fecha_primer_cobro) {
            const finance = require('../utils/finance');
            let dateObj = finance.parseLocalDate(prestamo.fecha_inicio);
            dateObj = finance.sumarFecha(dateObj, prestamo.frecuencia);
            prestamo.fecha_primer_cobro = finance.formatLocalDate(dateObj);
        }

        return prestamo;
    }

    // 7. Actualizar Estado
    static actualizarEstado(id, nuevoEstado) {
        return db.prepare('UPDATE prestamos SET estado = ? WHERE id = ?').run(nuevoEstado, id);
    }

    // 7.1 Actualizar Monto Total (para liquidación anticipada)
    static actualizarMontoTotal(id, nuevoMonto) {
        return db.prepare('UPDATE prestamos SET monto_total = ? WHERE id = ?').run(nuevoMonto, id);
    }

    // 8. Obtener Todos (Excel)
    static obtenerTodos() {
        const query = `
            SELECT p.*, c.nombre, c.apellido, c.dni 
            FROM prestamos p
            INNER JOIN clientes c ON p.cliente_id = c.id
            ORDER BY p.fecha_inicio DESC
        `;
        return db.prepare(query).all();
    }

    // 9. Obtener por Cliente
    static obtenerPorCliente(clienteId) {
        return db.prepare('SELECT * FROM prestamos WHERE cliente_id = ? ORDER BY fecha_inicio DESC').all(clienteId);
    }

    // 10. Procesar Vencimientos Automáticos
    static procesarVencimientos() {
        try {
            db.prepare(`
                UPDATE prestamos 
                SET estado = 'vencido' 
                WHERE fecha_fin < date('now', 'localtime') AND estado = 'pendiente'
            `).run();
        } catch (error) {
            console.error('Error procesando vencimientos:', error);
        }
    }

    // 11. Contar cuántos están vencidos (Para la notificación)
    static contarVencidos() {
        const row = db.prepare("SELECT COUNT(*) as total FROM prestamos WHERE estado = 'vencido'").get();
        return row.total;
    }

    // 12. Obtener lista de préstamos finalizados
    static obtenerFinalizados() {
        const query = `
            SELECT p.*, c.nombre, c.apellido, c.dni, c.telefono,
                   e.nombre_articulo, e.estado AS estado_garantia, e.estado_garantia AS garantia_final
            FROM prestamos p
            INNER JOIN clientes c ON p.cliente_id = c.id
            LEFT JOIN empenos e ON e.prestamo_id = p.id
            WHERE p.estado IN ('pagado', 'finalizado')
            ORDER BY p.fecha_fin DESC
        `;
        return db.prepare(query).all();
    }

    // 13. Obtener lista de morosos
    static obtenerVencidos() {
        const query = `
            SELECT p.*, c.nombre, c.apellido, c.dni, c.telefono
            FROM prestamos p
            INNER JOIN clientes c ON p.cliente_id = c.id
            WHERE p.estado = 'vencido'
            ORDER BY p.fecha_fin ASC
        `;
        return db.prepare(query).all();
    }

    // 13. Crear préstamo y descontar bóveda en una sola transacción atómica
    static crearConDescontarBoveda(datos) {
        const {
            cliente_id, monto_prestado, tasa_interes,
            monto_total, cuotas, frecuencia, fecha_inicio, fecha_fin, sistema_pago,
            fecha_primer_cobro
        } = datos;
        const sys_pago = sistema_pago || 'frances';

        const stmtPrestamo = db.prepare(`
            INSERT INTO prestamos
            (cliente_id, monto_prestado, tasa_interes, monto_total, cuotas, frecuencia, fecha_inicio, fecha_fin, sistema_pago, fecha_primer_cobro)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const stmtBoveda = db.prepare(
            'UPDATE boveda SET saldo_actual = saldo_actual - ? WHERE id = 1'
        );

        return db.transaction(() => {
            const result = stmtPrestamo.run(
                cliente_id, monto_prestado, tasa_interes,
                monto_total, cuotas, frecuencia, fecha_inicio, fecha_fin, sys_pago,
                fecha_primer_cobro
            );
            stmtBoveda.run(monto_prestado);
            return result;
        })();
    }

    // 14. Actualizar préstamo y ajustar bóveda en una sola transacción atómica
    static actualizarConAjustarBoveda(id, datos, diffMonto) {
        const {
            monto_prestado, tasa_interes,
            monto_total, cuotas, frecuencia, fecha_inicio, fecha_fin, sistema_pago,
            fecha_primer_cobro
        } = datos;
        const sys_pago = sistema_pago || 'frances';

        const stmtPrestamo = db.prepare(`
            UPDATE prestamos
            SET monto_prestado = ?, tasa_interes = ?, monto_total = ?, cuotas = ?, 
                frecuencia = ?, fecha_inicio = ?, fecha_fin = ?, sistema_pago = ?, fecha_primer_cobro = ?
            WHERE id = ?
        `);
        const stmtBoveda = db.prepare(
            'UPDATE boveda SET saldo_actual = saldo_actual - ? WHERE id = 1'
        );
        const stmtEmpeno = db.prepare(`
            UPDATE empenos
            SET monto_prestado = ?, fecha_limite = ?
            WHERE prestamo_id = ?
        `);

        return db.transaction(() => {
            const result = stmtPrestamo.run(
                monto_prestado, tasa_interes,
                monto_total, cuotas, frecuencia, fecha_inicio, fecha_fin, sys_pago,
                fecha_primer_cobro,
                id
            );
            stmtBoveda.run(diffMonto);
            stmtEmpeno.run(monto_prestado, fecha_fin, id);
            return result;
        })();
    }
}

module.exports = PrestamoModel;