require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const app = express();
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const flash = require('connect-flash');

// 1. Inicializar Base de Datos SQLite (antes de cargar modelos)
const db = require('./config/database');

// En desarrollo: inicializar esquema si la BD local está vacía
if (!process.env.APP_DATA_PATH) {
    const tablaExiste = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='usuarios'").get();
    if (!tablaExiste) {
        const schemaPath = path.join(__dirname, 'database', 'schema.sql');
        console.log('📦 Base de datos de desarrollo vacía. Inicializando...');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        db.exec(schema);
        console.log('✅ Base de datos inicializada.');
    }
}

const ConfigModel = require('./models/ConfigModel');
const PrestamoModel = require('./models/PrestamoModel');

// 2. Seguridad HTTP (headers)
app.use(helmet({
    contentSecurityPolicy: false // desactivado para no romper EJS + CDNs externos
}));

// 3. Configuración de Sesiones
if (!process.env.SESSION_SECRET) {
    console.warn('⚠️  ADVERTENCIA CRÍTICA: SESSION_SECRET no está definido en .env. El sistema está usando un valor inseguro. Defínelo antes de usar en producción.');
}

app.use(session({
    secret: process.env.SESSION_SECRET || 'misacorp_dev_secret_NO_USAR_EN_PRODUCCION',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,   // cambiar a true si usas HTTPS
        httpOnly: true,  // la cookie no es accesible desde JS del navegador
        sameSite: 'lax', // protección básica contra CSRF
        maxAge: 1000 * 60 * 60 * 8 // 8 horas
    }
}));

app.use(flash());

// 3. Configuración del motor de plantillas EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 4. Archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
if (process.env.APP_DATA_PATH) {
    app.use('/uploads', express.static(path.join(process.env.APP_DATA_PATH, 'public', 'uploads')));
}

// 5. Procesar datos de formularios
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 6. VARIABLES GLOBALES E INTELIGENCIA
app.use((req, res, next) => {
    res.locals.mensajeExito = req.flash('mensajeExito');
    res.locals.mensajeError = req.flash('mensajeError');
    res.locals.usuario = req.session.usuario || null;
    res.locals.currentPath = req.path;

    try {
        const config = ConfigModel.obtener();
        res.locals.empresa = config || { nombre_empresa: 'Sistema', logo: null };

        // Alertas de Vencidos (procesarVencimientos corre cada 10 min, no en cada request)
        if (req.session.usuario) {
            const totalVencidos = PrestamoModel.contarVencidos();
            res.locals.alertasVencidos = totalVencidos;
        } else {
            res.locals.alertasVencidos = 0;
        }
    } catch (error) {
        res.locals.empresa = { nombre_empresa: 'Sistema', logo: null };
        res.locals.alertasVencidos = 0;
    }

    next();
});

// ---> RUTAS Y CONTROLADORES
const protegerRuta = require('./middleware/auth');
const dashboardController = require('./controllers/dashboardController');

// 7. DEFINICIÓN DE RUTAS
app.use('/auth', require('./routes/auth'));

// Rutas Privadas
app.get('/', protegerRuta, dashboardController.mostrarDashboard);

app.use('/clientes', protegerRuta, require('./routes/clientes'));
app.use('/prestamos', protegerRuta, require('./routes/prestamos'));
app.use('/pagos', protegerRuta, require('./routes/pagos'));
app.use('/empenos', protegerRuta, require('./routes/empenos'));
app.use('/ahorros', protegerRuta, require('./routes/ahorros'));
app.use('/usuarios', protegerRuta, require('./routes/usuarios'));
app.use('/reportes', protegerRuta, require('./routes/reportes'));
app.use('/config', protegerRuta, require('./routes/config'));
app.use('/perfil', protegerRuta, require('./routes/perfil'));
app.use('/gastos', protegerRuta, require('./routes/gastos'));
app.use('/caja', protegerRuta, require('./routes/caja'));
app.use('/backup', protegerRuta, require('./routes/backup'));
app.use('/bitacora', protegerRuta, require('./routes/bitacora'));
app.use('/simulador', protegerRuta, require('./routes/simulador'));
app.use('/boveda', protegerRuta, require('./routes/boveda'));

// MANEJADOR DE ERROR 404
app.use((req, res, next) => {
    res.status(404).render('404');
});

// MANEJADOR DE ERRORES GLOBAL (debe ir al final, después de todas las rutas)
app.use((err, req, res, next) => {
    console.error('Error no controlado:', err.stack || err);
    req.flash('mensajeError', 'Ocurrió un error inesperado en el servidor');
    const destino = req.headers.referer || '/';
    res.redirect(destino);
});

// 8. Iniciar Servidor
const BitacoraModel = require('./models/BitacoraModel');
const AhorroModel = require('./models/AhorroModel');
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`\n--- SERVIDOR INICIADO ---`);
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    try { BitacoraModel.inicializar(); } catch(e) {}
    try { AhorroModel.inicializar(); } catch(e) {}

    // Procesar vencimientos al arrancar y cada 10 minutos (no en cada request)
    try { PrestamoModel.procesarVencimientos(); } catch(e) {}
    setInterval(() => {
        try { PrestamoModel.procesarVencimientos(); } catch(e) {}
    }, 10 * 60 * 1000);
});

// Escuchar comando de apagado desde Electron (proceso principal)
process.on('message', (msg) => {
    if (msg === 'exit') {
        console.log('[Express] Cerrando base de datos y deteniendo servidor...');
        process.exit(0);
    }
});