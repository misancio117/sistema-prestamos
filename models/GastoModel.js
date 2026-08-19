const db = require('../config/database');

class GastoModel {

    // 1. Obtener Paginados
    static obtenerPaginados(limit, offset) {
        return db.prepare('SELECT * FROM gastos ORDER BY fecha_gasto DESC LIMIT ? OFFSET ?').all(limit, offset);
    }

    // 2. Contar Total
    static contarTotal() {
        return db.prepare('SELECT COUNT(*) as total FROM gastos').get().total;
    }

    // 3. Buscar Paginados
    static buscarPaginados(busqueda, limit, offset) {
        const criterio = `%${busqueda}%`;
        const query = `
            SELECT * FROM gastos 
            WHERE descripcion LIKE ? OR categoria LIKE ? 
            ORDER BY fecha_gasto DESC 
            LIMIT ? OFFSET ?
        `;
        return db.prepare(query).all(criterio, criterio, limit, offset);
    }

    // 4. Contar Búsqueda
    static contarBusqueda(busqueda) {
        const criterio = `%${busqueda}%`;
        const query = `
            SELECT COUNT(*) as total FROM gastos 
            WHERE descripcion LIKE ? OR categoria LIKE ?
        `;
        return db.prepare(query).get(criterio, criterio).total;
    }

    // 5. Crear Gasto
    static crear(datos) {
        const { descripcion, monto, categoria, registrado_por, observacion } = datos;
        const query = `
            INSERT INTO gastos (descripcion, monto, categoria, registrado_por, observacion, fecha_gasto) 
            VALUES (?, ?, ?, ?, ?, date('now', 'localtime'))
        `;
        return db.prepare(query).run(descripcion, monto, categoria, registrado_por, observacion);
    }

    // 6. Eliminar Gasto
    static eliminar(id) {
        return db.prepare('DELETE FROM gastos WHERE id = ?').run(id);
    }

    // 7. Crear gasto y descontar bóveda en una sola transacción atómica
    static crearConDescontarBoveda(datos) {
        const { descripcion, monto, categoria, registrado_por, observacion } = datos;

        const stmtGasto = db.prepare(`
            INSERT INTO gastos (descripcion, monto, categoria, registrado_por, observacion, fecha_gasto)
            VALUES (?, ?, ?, ?, ?, date('now', 'localtime'))
        `);
        const stmtBoveda = db.prepare(
            'UPDATE boveda SET saldo_actual = saldo_actual - ? WHERE id = 1'
        );

        return db.transaction(() => {
            const result = stmtGasto.run(descripcion, monto, categoria, registrado_por, observacion);
            stmtBoveda.run(monto);
            return result;
        })();
    }
}

module.exports = GastoModel;