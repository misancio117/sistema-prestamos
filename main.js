// main.js — Punto de entrada de Electron
const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { fork } = require('child_process');

let mainWindow;
let serverProcess;

function initDatabase() {
    const userData = app.getPath('userData');
    const dbDir = path.join(userData, 'database');
    const dbPath = path.join(dbDir, 'database.db');

    if (!fs.existsSync(dbPath)) {
        fs.mkdirSync(dbDir, { recursive: true });
        const seedPath = path.join(process.resourcesPath, 'database', 'seed.db');
        fs.copyFileSync(seedPath, dbPath);
        console.log('[Electron] Base de datos inicializada desde seed.db');
    }
}

function startServer() {
    // Resolver la ruta correcta según si está empaquetado o en desarrollo
    const appPath = app.isPackaged
        ? path.join(process.resourcesPath, 'app')  // dentro del .asar empaquetado
        : __dirname;

    const serverScript = path.join(appPath, 'app.js');

    serverProcess = fork(serverScript, [], {
        execPath: process.execPath,
        env: {
            ...process.env,
            ELECTRON_RUN_AS_NODE: '1',
            PORT: '3000',
            SESSION_SECRET: 'misacorp_electron_secret_seguro_2024_prestamos',
            NODE_ENV: 'production',
            EMAIL_HOST: 'smtp.gmail.com',
            EMAIL_PORT: '465',
            EMAIL_USER: 'vitosistemasdev@gmail.com',
            EMAIL_PASS: 'phouzmzvayxbhcae',
            // Ruta de datos de usuario (AppData) para escritura
            APP_DATA_PATH: app.isPackaged
                ? app.getPath('userData')
                : __dirname
        },
        silent: false
    });

    serverProcess.on('error', (err) => {
        console.error('[Electron] Error en el servidor Express:', err);
    });

    serverProcess.on('exit', (code) => {
        console.log(`[Electron] Servidor Express terminó con código: ${code}`);
    });
}

function checkServerReady(callback) {
    http.get('http://localhost:3000', (res) => {
        // El servidor está listo si responde con código estándar HTTP
        if (res.statusCode === 200 || res.statusCode === 302 || res.statusCode === 404) {
            callback(true);
        } else {
            callback(false);
        }
    }).on('error', () => {
        callback(false);
    });
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1366,
        height: 768,
        minWidth: 1024,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        },
        title: 'Sistema de Préstamos - MISACORP',
        autoHideMenuBar: true,
        show: false  // No mostrar hasta que esté lista
    });

    // Cargar la pantalla de carga local instantáneamente
    mainWindow.loadFile(path.join(__dirname, 'public', 'loading.html'));

    // Mostrar la ventana tan pronto esté lista para pintar la pantalla de carga
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Monitorear e intentar cargar la aplicación Express real en cuanto responda
    const pollServer = () => {
        checkServerReady((ready) => {
            if (ready) {
                mainWindow.loadURL('http://localhost:3000').catch(() => {
                    setTimeout(pollServer, 300);
                });
            } else {
                setTimeout(pollServer, 300); // reintentar cada 300ms
            }
        });
    };

    // Comenzar el chequeo tras 300ms
    setTimeout(pollServer, 300);

    // Manejar la apertura de nuevas ventanas
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        // Si es una URL local de nuestra propia aplicación Express
        if (url.startsWith('http://localhost:3000') || url.startsWith('http://127.0.0.1:3000')) {

            // Si hacen click en exportar cronograma PDF → imprimir silenciosamente
            if (url.includes('/reportes/cronograma_pdf/')) {
                const id = url.split('/').pop();
                const printUrl = `http://localhost:3000/prestamos/cronograma/${id}?print=true`;

                const printWindow = new BrowserWindow({
                    show: false,
                    webPreferences: { nodeIntegration: false, contextIsolation: true }
                });

                printWindow.loadURL(printUrl);
                printWindow.webContents.on('did-finish-load', () => {
                    setTimeout(() => {
                        printWindow.webContents.print({
                            silent: false,
                            printBackground: true,
                            deviceName: ''
                        }, () => { printWindow.destroy(); });
                    }, 800);
                });

                return { action: 'deny' };
            }

            // Para cualquier otra URL local (incluyendo contrato), abrir ventana visible
            const previewWindow = new BrowserWindow({
                width: 900,
                height: 750,
                minWidth: 700,
                minHeight: 500,
                webPreferences: { nodeIntegration: false, contextIsolation: true },
                title: 'Vista Previa',
                autoHideMenuBar: true,
                parent: mainWindow
            });

            previewWindow.loadURL(url);
            return { action: 'deny' };
        }

        // Si es una dirección externa, abrirla en el navegador por defecto del sistema operativo
        shell.openExternal(url);
        return { action: 'deny' };
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.on('ready', () => {
    if (app.isPackaged) initDatabase();
    startServer();
    createWindow();
});

function killServer() {
    if (serverProcess) {
        try {
            serverProcess.send('exit'); // Enviar mensaje de salida amigable
        } catch (e) {}
        
        const processToKill = serverProcess;
        setTimeout(() => {
            if (processToKill && !processToKill.killed) {
                try {
                    processToKill.kill('SIGKILL'); // Forzar cierre en Windows si sigue activo
                } catch (e) {}
            }
        }, 800);
        serverProcess = null;
    }
}

app.on('window-all-closed', () => {
    killServer();
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) createWindow();
});

// Manejo seguro al cerrar completamente
app.on('before-quit', () => {
    killServer();
});
