const db = require('../config/database');

class EmpenoModel {

    static obtenerTodos() {
        const query = `
            SELECT e.*, c.nombre, c.apellido, c.dni 
            FROM empenos e
            INNER JOIN clientes c ON e.cliente_id = c.id
            ORDER BY e.created_at DESC
        `;
        return db.prepare(query).all();
    }

    static crear(datos) {
        const { 
            cliente_id, nombre_articulo, descripcion, 
            valor_tasacion, monto_prestado, fecha_limite, imagen, prestamo_id 
        } = datos;

        const query = `
            INSERT INTO empenos 
            (cliente_id, nombre_articulo, descripcion, valor_tasacion, monto_prestado, fecha_limite, imagen, prestamo_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        return db.prepare(query).run(
            cliente_id, nombre_articulo, descripcion, 
            valor_tasacion, monto_prestado, fecha_limite, imagen, prestamo_id
        );
    }

    static cambiarEstado(id, nuevoEstado) {
        return db.prepare('UPDATE empenos SET estado = ? WHERE id = ?').run(nuevoEstado, id);
    }

    static obtenerPorCliente(clienteId) {
        return db.prepare('SELECT * FROM empenos WHERE cliente_id = ? ORDER BY created_at DESC').all(clienteId);
    }

    static obtenerPorPrestamo(prestamoId) {
        return db.prepare('SELECT * FROM empenos WHERE prestamo_id = ?').get(prestamoId);
    }

    static liberarPorPrestamo(prestamoId) {
        return db.prepare("UPDATE empenos SET estado = 'devuelto' WHERE prestamo_id = ?").run(prestamoId);
    }

    static obtenerPorEstado(estado) {
        const query = `
            SELECT e.*, c.nombre, c.apellido, c.dni 
            FROM empenos e
            INNER JOIN clientes c ON e.cliente_id = c.id
            WHERE e.estado = ?
            ORDER BY e.created_at DESC
        `;
        return db.prepare(query).all(estado);
    }

    static obtenerPorEstados(estados) {
        const placeholders = estados.map(() => '?').join(',');
        const query = `
            SELECT e.*, c.nombre, c.apellido, c.dni 
            FROM empenos e
            INNER JOIN clientes c ON e.cliente_id = c.id
            WHERE e.estado IN (${placeholders})
            ORDER BY e.created_at DESC
        `;
        return db.prepare(query).all(...estados);
    }

    static obtenerPorBusqueda(criterio) {
        const busqueda = `%${criterio}%`;
        const query = `
            SELECT e.*, c.nombre, c.apellido, c.dni 
            FROM empenos e
            INNER JOIN clientes c ON e.cliente_id = c.id
            WHERE c.nombre LIKE ? OR c.apellido LIKE ? OR e.nombre_articulo LIKE ?
            ORDER BY e.created_at DESC
        `;
        return db.prepare(query).all(busqueda, busqueda, busqueda);
    }

    static actualizarEstadoGarantia(id, estadoGarantia) {
        return db.prepare('UPDATE empenos SET estado_garantia = ? WHERE id = ?').run(estadoGarantia, id);
    }
}

module.exports = EmpenoModel;
