const db = require('../config/database');

class ConfigModel {
    
    // Obtener la configuración actual (siempre ID 1)
    static obtener() {
        return db.prepare('SELECT * FROM configuracion WHERE id = 1').get();
    }

    // Actualizar datos
    static actualizar(datos) {
        const { nombre_empresa, ruc, direccion, telefono, email_contacto, moneda, logo } = datos;
        
        const params = [nombre_empresa, ruc, direccion, telefono, email_contacto, moneda];

        let query = `
            UPDATE configuracion 
            SET nombre_empresa=?, ruc=?, direccion=?, telefono=?, email_contacto=?, moneda=?
        `;

        // Solo actualizamos el logo si se subió uno nuevo
        if (logo) {
            query += `, logo=?`;
            params.push(logo);
        }

        query += ` WHERE id = 1`;

        return db.prepare(query).run(...params);
    }
}

module.exports = ConfigModel;