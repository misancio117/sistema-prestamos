const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const seedPath = path.join(__dirname, '..', 'database', 'seed.db');
const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');

if (fs.existsSync(seedPath)) fs.unlinkSync(seedPath);

const db = new Database(seedPath);
const schema = fs.readFileSync(schemaPath, 'utf8');
db.exec(schema);
db.close();

console.log('✅ seed.db creado en database/seed.db');
