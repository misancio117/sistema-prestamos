const db = require('../config/database');

class ClienteModel {
    
    // 1. Obtener paginados
    static obtenerPaginados(limit, offset) {
        return db.prepare('SELECT * FROM clientes ORDER BY created_at DESC LIMIT ? OFFSET ?').all(limit, offset);
    }

    // 2. Contar total
    static contarTotal() {
        return db.prepare('SELECT COUNT(*) as total FROM clientes').get().total;
    }

    // 3. Crear cliente
    static crear(datos) {
        const { dni, nombre, apellido, telefono, direccion, email, foto } = datos;
        const query = `
            INSERT INTO clientes (dni, nombre, apellido, telefono, direccion, email, foto) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        return db.prepare(query).run(dni, nombre, apellido, telefono, direccion, email, foto);
    }

    // 4. Buscar por DNI
    static buscarPorDNI(dni) {
        return db.prepare('SELECT * FROM clientes WHERE dni = ?').get(dni);
    }

    // 5. Obtener Todos
    static obtenerTodos() {
        return db.prepare('SELECT * FROM clientes ORDER BY nombre ASC').all();
    }

    // 6. Buscador Paginado
    static buscarPaginados(criterio, limit, offset) {
        const busqueda = `%${criterio}%`;
        const query = `
            SELECT * FROM clientes 
            WHERE nombre LIKE ? OR apellido LIKE ? OR dni LIKE ? 
            ORDER BY nombre ASC 
            LIMIT ? OFFSET ?
        `;
        return db.prepare(query).all(busqueda, busqueda, busqueda, limit, offset);
    }

    // 7. Contar búsqueda
    static contarBusqueda(criterio) {
        const busqueda = `%${criterio}%`;
        const query = `
            SELECT COUNT(*) as total FROM clientes 
            WHERE nombre LIKE ? OR apellido LIKE ? OR dni LIKE ?
        `;
        return db.prepare(query).get(busqueda, busqueda, busqueda).total;
    }

    // 8. Obtener por ID
    static obtenerPorId(id) {
        return db.prepare('SELECT * FROM clientes WHERE id = ?').get(id);
    }

    // 9. Actualizar Cliente
    static actualizar(id, datos) {
        const { dni, nombre, apellido, telefono, direccion, email, foto } = datos;
        
        if (foto) {
            return db.prepare(
                `UPDATE clientes SET dni=?, nombre=?, apellido=?, telefono=?, direccion=?, email=?, foto=? WHERE id=?`
            ).run(dni, nombre, apellido, telefono, direccion, email, foto, id);
        } else {
            return db.prepare(
                `UPDATE clientes SET dni=?, nombre=?, apellido=?, telefono=?, direccion=?, email=? WHERE id=?`
            ).run(dni, nombre, apellido, telefono, direccion, email, id);
        }
    }
}

module.exports = ClienteModel;