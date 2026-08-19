const db = require('../config/database');
const bcrypt = require('bcryptjs');

const args = process.argv.slice(2);
if (args.length < 3) {
    console.error('Uso: node scripts/create-admin-user.js "<nombre_completo>" "<email>" "<password>"');
    process.exit(1);
}

const [nombre, email, password] = args;

if (password.length < 8) {
    console.error('Error: La contraseña debe tener al menos 8 caracteres.');
    process.exit(1);
}

try {
    const existe = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(email);
    if (existe) {
        console.error(`Error: El correo electrónico ${email} ya está registrado.`);
        process.exit(1);
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const query = `
        INSERT INTO usuarios (nombre_completo, email, password, rol, estado) 
        VALUES (?, ?, ?, 'admin', 1)
    `;
    const result = db.prepare(query).run(nombre, email, passwordHash);
    console.log(`✅ Usuario admin creado exitosamente con ID: ${result.lastInsertRowid}`);
} catch (error) {
    console.error('Error al crear el usuario:', error);
    process.exit(1);
}
