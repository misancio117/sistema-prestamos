const db = require('../config/database');

class UsuarioModel {
    
    // 1. Buscar por email (Login)
    static buscarPorEmail(email) {
        return db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email);
    }

    // 2. Buscar por ID (Perfil)
    static buscarPorId(id) {
        return db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id);
    }

    // 3. Obtener todos (Admin)
    static obtenerTodos() {
        return db.prepare('SELECT id, nombre_completo, email, rol, estado, created_at FROM usuarios ORDER BY id DESC').all();
    }

    // 4. Crear usuario
    static crear(datos) {
        const { nombre_completo, email, password, rol } = datos;
        const query = `
            INSERT INTO usuarios (nombre_completo, email, password, rol, estado) 
            VALUES (?, ?, ?, ?, 1)
        `;
        return db.prepare(query).run(nombre_completo, email, password, rol);
    }

    // 5. Eliminar usuario
    static eliminar(id) {
        return db.prepare('DELETE FROM usuarios WHERE id = ?').run(id);
    }

    // 6. Actualizar Datos Básicos (Perfil)
    static actualizarDatos(id, nombre, email) {
        return db.prepare('UPDATE usuarios SET nombre_completo = ?, email = ? WHERE id = ?').run(nombre, email, id);
    }

    // 7. Actualizar Contraseña
    static actualizarPassword(id, passwordHash) {
        return db.prepare('UPDATE usuarios SET password = ? WHERE id = ?').run(passwordHash, id);
    }
}

module.exports = UsuarioModel;