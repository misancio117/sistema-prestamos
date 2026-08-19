const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const ML = 50;
const CW = PAGE_W - ML * 2;

const C = {
    primary:   '#1e3a5f',
    blue:      '#2563eb',
    lightBlue: '#dbeafe',
    green:     '#15803d',
    lightGreen:'#dcfce7',
    orange:    '#92400e',
    lightOrange:'#fef3c7',
    bg:        '#f1f5f9',
    border:    '#cbd5e1',
    gray:      '#64748b',
    dark:      '#1e293b',
    white:     '#ffffff',
    accent:    '#93c5fd',
};

const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 55, bottom: 55, left: ML, right: ML },
    autoFirstPage: false,
    bufferPages: true,
});

const outputPath = path.join(__dirname, '..', 'Manual_Sistema_Prestamos_MISACORP.pdf');
doc.pipe(fs.createWriteStream(outputPath));

let currentChapter = '';

// ─── helpers ────────────────────────────────────────────────────────────────

function newPage(chapter) {
    if (chapter !== undefined) currentChapter = chapter;
    doc.addPage();
    // top bar
    doc.rect(0, 0, PAGE_W, 38).fill(C.primary);
    doc.fillColor(C.white).fontSize(9).font('Helvetica');
    doc.text('Sistema de Préstamos MISACORP  —  Manual de Usuario', ML, 15, { width: CW * 0.6 });
    if (currentChapter) {
        doc.text(currentChapter, ML, 15, { align: 'right', width: CW });
    }
    doc.fillColor(C.dark);
    doc.y = 58;
}

function guard(needed = 80) {
    if (doc.y + needed > PAGE_H - 60) newPage();
}

function h1(text, color = C.primary) {
    guard(50);
    const y = doc.y;
    doc.rect(ML, y, CW, 30).fill(color);
    doc.fillColor(C.white).fontSize(14).font('Helvetica-Bold');
    doc.text(text, ML + 12, y + 8, { width: CW - 24 });
    doc.fillColor(C.dark);
    doc.y = y + 38;
}

function h2(text) {
    guard(40);
    doc.moveDown(0.4);
    doc.fillColor(C.blue).fontSize(11).font('Helvetica-Bold');
    doc.text(text, ML, doc.y, { width: CW });
    doc.rect(ML, doc.y, CW, 1).fill(C.lightBlue);
    doc.fillColor(C.dark);
    doc.moveDown(0.4);
}

function body(text, indent = 0) {
    guard(30);
    doc.fillColor(C.dark).fontSize(10).font('Helvetica');
    doc.text(text, ML + indent, doc.y, { width: CW - indent, lineGap: 3 });
    doc.moveDown(0.25);
}

function li(text, indent = 12) {
    guard(20);
    doc.fillColor(C.dark).fontSize(10).font('Helvetica');
    doc.text(`•  ${text}`, ML + indent, doc.y, { width: CW - indent, lineGap: 3 });
}

function step(n, text) {
    guard(20);
    const y = doc.y;
    doc.rect(ML, y, 20, 18).fill(C.blue);
    doc.fillColor(C.white).fontSize(10).font('Helvetica-Bold').text(`${n}`, ML + 6, y + 4);
    doc.fillColor(C.dark).fontSize(10).font('Helvetica').text(text, ML + 28, y + 4, { width: CW - 28, lineGap: 3 });
    doc.y = Math.max(doc.y, y + 22);
    doc.moveDown(0.2);
}

function infoBox(text) {
    guard(45);
    doc.moveDown(0.3);
    const y = doc.y;
    const lines = Math.ceil(text.length / 70);
    const h = 16 + lines * 14;
    doc.rect(ML, y, CW, h).fill(C.lightBlue).stroke(C.blue);
    doc.fillColor(C.primary).fontSize(10).font('Helvetica').text(`ℹ  ${text}`, ML + 10, y + 8, { width: CW - 20, lineGap: 3 });
    doc.fillColor(C.dark);
    doc.y = y + h + 8;
}

function tipBox(text) {
    guard(45);
    doc.moveDown(0.3);
    const y = doc.y;
    const lines = Math.ceil(text.length / 70);
    const h = 16 + lines * 14;
    doc.rect(ML, y, CW, h).fill(C.lightGreen).stroke(C.green);
    doc.fillColor(C.green).fontSize(10).font('Helvetica').text(`✓  ${text}`, ML + 10, y + 8, { width: CW - 20, lineGap: 3 });
    doc.fillColor(C.dark);
    doc.y = y + h + 8;
}

function warnBox(text) {
    guard(45);
    doc.moveDown(0.3);
    const y = doc.y;
    const lines = Math.ceil(text.length / 70);
    const h = 16 + lines * 14;
    doc.rect(ML, y, CW, h).fill(C.lightOrange).stroke('#d97706');
    doc.fillColor(C.orange).fontSize(10).font('Helvetica').text(`⚠  ${text}`, ML + 10, y + 8, { width: CW - 20, lineGap: 3 });
    doc.fillColor(C.dark);
    doc.y = y + h + 8;
}

function gap(n = 0.5) { doc.moveDown(n); }

// ─── PORTADA ─────────────────────────────────────────────────────────────────

doc.addPage();

doc.rect(0, 0, PAGE_W, 310).fill(C.primary);
doc.rect(0, 305, PAGE_W, 8).fill(C.blue);

doc.fillColor(C.white).fontSize(34).font('Helvetica-Bold');
doc.text('MANUAL DE USUARIO', ML, 80, { align: 'center', width: CW });
doc.fillColor(C.accent).fontSize(18).font('Helvetica');
doc.text('Sistema de Gestión de Préstamos', ML, 128, { align: 'center', width: CW });
doc.fillColor(C.white).fontSize(22).font('Helvetica-Bold');
doc.text('MISACORP', ML, 162, { align: 'center', width: CW });
doc.rect(ML + 160, 200, 175, 3).fill(C.accent);
doc.fillColor(C.accent).fontSize(11).font('Helvetica');
doc.text('Versión 1.0  ·  2025', ML, 215, { align: 'center', width: CW });
doc.text('Para uso del personal operativo', ML, 232, { align: 'center', width: CW });

// descripcion
doc.fillColor(C.dark).fontSize(11).font('Helvetica');
doc.text('Este manual está diseñado para que cualquier persona pueda aprender a\nusar el sistema sin necesidad de conocimientos técnicos.', ML, 345, { align: 'center', width: CW, lineGap: 4 });

// cuadro de modulos
doc.rect(ML, 415, CW, 230).fill(C.bg);
doc.rect(ML, 415, CW, 230).stroke(C.border);
doc.fillColor(C.primary).fontSize(12).font('Helvetica-Bold');
doc.text('¿Qué puede hacer con este sistema?', ML + 16, 430);
doc.rect(ML + 16, 447, 200, 1).fill(C.blue);

const feats = [
    '✔  Registrar y gestionar clientes',
    '✔  Otorgar préstamos y ver cronogramas',
    '✔  Registrar cobros y emitir recibos',
    '✔  Controlar empeños y garantías',
    '✔  Manejar cuentas de ahorro',
    '✔  Registrar gastos operativos',
    '✔  Generar contratos y reportes en PDF',
    '✔  Monitorear la bóveda (capital disponible)',
    '✔  Hacer cortes de caja diarios',
    '✔  Respaldar la base de datos',
];
doc.fillColor(C.dark).fontSize(10).font('Helvetica');
feats.forEach((f, i) => doc.text(f, ML + 20, 456 + i * 19));

doc.rect(0, PAGE_H - 45, PAGE_W, 45).fill(C.primary);
doc.fillColor(C.accent).fontSize(9).font('Helvetica');
doc.text('MISACORP  ·  Sistema de Gestión de Préstamos  ·  Documento de uso interno', ML, PAGE_H - 26, { align: 'center', width: CW });

// ─── ÍNDICE ───────────────────────────────────────────────────────────────────

newPage('Índice');
doc.fillColor(C.primary).fontSize(20).font('Helvetica-Bold');
doc.text('ÍNDICE DE CONTENIDOS', ML, doc.y, { align: 'center', width: CW });
gap(1);

const toc = [
    ['1.', 'Requisitos del sistema'],
    ['2.', 'Cómo iniciar sesión'],
    ['3.', 'Panel principal (Dashboard)'],
    ['4.', 'Módulo de Clientes'],
    ['5.', 'Módulo de Préstamos'],
    ['6.', 'Módulo de Pagos'],
    ['7.', 'Módulo de Empeños'],
    ['8.', 'Módulo de Ahorros'],
    ['9.', 'Módulo de Gastos'],
    ['10.', 'Módulo de Caja'],
    ['11.', 'Bóveda (Capital disponible)'],
    ['12.', 'Módulo de Usuarios'],
    ['13.', 'Simulador de Préstamos'],
    ['14.', 'Reportes y Documentos'],
    ['15.', 'Configuración del sistema'],
    ['16.', 'Bitácora'],
    ['17.', 'Respaldo (Backup)'],
    ['18.', 'Consejos y buenas prácticas'],
];

toc.forEach(([num, title]) => {
    const y = doc.y;
    doc.fillColor(C.blue).fontSize(10).font('Helvetica-Bold').text(num, ML + 10, y, { width: 30 });
    doc.fillColor(C.dark).fontSize(10).font('Helvetica').text(title, ML + 45, y, { width: CW - 45 });
    doc.rect(ML + 45, doc.y + 1, CW - 45, 0.5).fill(C.border);
    doc.moveDown(0.6);
});

// ─── 1. REQUISITOS ────────────────────────────────────────────────────────────

newPage('Requisitos del sistema');
h1('1.  REQUISITOS DEL SISTEMA');
body('Para que el sistema funcione correctamente en el equipo donde se va a instalar, se necesita lo siguiente:');
gap(0.4);
h2('Sistema operativo');
li('Windows 10 o Windows 11 (versión de 64 bits)');
li('No funciona en Windows 7, Windows 8 ni en equipos de 32 bits');
gap(0.3);
h2('Hardware mínimo recomendado');
li('Procesador: cualquier procesador moderno de 64 bits (Intel o AMD)');
li('Memoria RAM: mínimo 4 GB');
li('Espacio en disco: mínimo 500 MB libres');
li('Pantalla: resolución mínima 1024 x 600 píxeles');
gap(0.3);
h2('Conexión a internet');
li('No se necesita internet para usar el sistema');
li('Solo se requiere si se usa la función de envío de correos electrónicos');
gap(0.3);
h2('¿Qué NO se necesita instalar por separado?');
body('El instalador ya incluye todo lo necesario. No hace falta instalar:');
li('Node.js');
li('SQLite');
li('Ningún programa adicional');
gap(0.3);
infoBox('El instalador solicitará permisos de Administrador durante la instalación. Esto es normal y necesario para que el sistema funcione correctamente.');

// ─── 2. INICIO DE SESIÓN ─────────────────────────────────────────────────────

newPage('Cómo iniciar sesión');
h1('2.  CÓMO INICIAR SESIÓN');
body('Al abrir el sistema se mostrará la pantalla de inicio de sesión. Siga los siguientes pasos:');
gap(0.4);
step(1, 'En el campo "Correo electrónico" escriba su dirección de correo registrada en el sistema.');
step(2, 'En el campo "Contraseña" escriba su contraseña personal.');
step(3, 'Haga clic en el botón "Iniciar Sesión".');
step(4, 'Si los datos son correctos, el sistema lo llevará al Panel Principal.');
gap(0.5);
h2('Credenciales iniciales del Administrador');
body('La primera vez que se instala el sistema, el usuario administrador tiene las siguientes credenciales:');
gap(0.2);
const y0 = doc.y;
doc.rect(ML, y0, CW, 52).fill(C.bg).stroke(C.border);
doc.fillColor(C.gray).fontSize(9).font('Helvetica').text('CORREO ELECTRÓNICO', ML + 16, y0 + 10);
doc.fillColor(C.primary).fontSize(12).font('Helvetica-Bold').text('admin@sistema.com', ML + 16, y0 + 22);
doc.fillColor(C.gray).fontSize(9).font('Helvetica').text('CONTRASEÑA', ML + 260, y0 + 10);
doc.fillColor(C.primary).fontSize(12).font('Helvetica-Bold').text('admin123', ML + 260, y0 + 22);
doc.fillColor(C.dark);
doc.y = y0 + 60;
gap(0.3);
warnBox('Por seguridad, cambie la contraseña del administrador inmediatamente después del primer inicio de sesión. Vaya a su Perfil (ícono de usuario arriba a la derecha) para cambiarla.');
gap(0.3);
h2('¿Qué pasa si olvidó su contraseña?');
body('Contacte al administrador del sistema. El administrador puede crear una nueva contraseña para su usuario desde el Módulo de Usuarios.');

// ─── 3. PANEL PRINCIPAL ───────────────────────────────────────────────────────

newPage('Panel Principal');
h1('3.  PANEL PRINCIPAL (DASHBOARD)');
body('Al iniciar sesión, lo primero que verá es el Panel Principal. Este panel muestra un resumen general de la situación actual del negocio de un solo vistazo.');
gap(0.4);
h2('¿Qué información muestra?');
li('Total de clientes registrados en el sistema');
li('Cantidad de préstamos activos, pagados y vencidos');
li('Monto total prestado y monto total por cobrar');
li('Capital disponible en la bóveda');
li('Alertas de préstamos vencidos (si los hay)');
gap(0.3);
h2('Menú de navegación');
body('En la parte izquierda de la pantalla encontrará el menú principal con acceso a todos los módulos del sistema. Solo tiene que hacer clic en el nombre del módulo para acceder a él.');
gap(0.3);
tipBox('Si ve una alerta de préstamos vencidos en el panel, revise el Módulo de Préstamos para ver qué clientes tienen pagos atrasados.');

// ─── 4. CLIENTES ─────────────────────────────────────────────────────────────

newPage('Clientes');
h1('4.  MÓDULO DE CLIENTES');
body('Este módulo permite registrar y gestionar toda la información de los clientes de la financiera. Cada cliente tiene un expediente completo con su historial de préstamos, empeños y ahorros.');
gap(0.4);
h2('Cómo registrar un cliente nuevo');
step(1, 'Haga clic en "Clientes" en el menú lateral.');
step(2, 'Haga clic en el botón "Nuevo Cliente".');
step(3, 'Complete el formulario con los datos del cliente.');
step(4, 'Si tiene una foto del cliente, puede adjuntarla haciendo clic en el campo de foto.');
step(5, 'Haga clic en "Guardar" para registrar al cliente.');
gap(0.3);
h2('Datos del cliente');
li('DNI o número de identificación (obligatorio y único — no puede haber dos clientes con el mismo DNI)');
li('Nombre y apellido (obligatorios)');
li('Teléfono de contacto');
li('Dirección');
li('Correo electrónico');
li('Foto (opcional, formatos JPG o PNG)');
gap(0.3);
h2('Buscar un cliente');
body('En la pantalla de listado de clientes hay una barra de búsqueda. Puede buscar por nombre, apellido, DNI o teléfono. Escriba alguno de esos datos y el sistema filtrará los resultados automáticamente.');
gap(0.3);
h2('Ver el expediente de un cliente');
body('Haga clic en el nombre del cliente para ver su expediente completo: todos sus préstamos, empeños y cuenta de ahorros.');
gap(0.3);
h2('Editar datos de un cliente');
body('En la lista de clientes, haga clic en el botón "Editar" del cliente que desea modificar. Realice los cambios y guarde.');
gap(0.3);
infoBox('No se puede eliminar un cliente que tenga préstamos activos. Primero deben liquidarse todos sus préstamos.');

// ─── 5. PRÉSTAMOS ────────────────────────────────────────────────────────────

newPage('Préstamos');
h1('5.  MÓDULO DE PRÉSTAMOS');
body('Este es el módulo principal del sistema. Aquí se registran todos los créditos otorgados a los clientes y se puede ver el estado de cada uno.');
gap(0.4);
h2('Cómo registrar un préstamo nuevo');
step(1, 'Haga clic en "Préstamos" en el menú lateral.');
step(2, 'Haga clic en el botón "Nuevo Préstamo".');
step(3, 'Seleccione el cliente al que le va a prestar.');
step(4, 'Complete los datos del préstamo (ver campos más abajo).');
step(5, 'Si el préstamo tiene una garantía (empeño), active esa sección y complete los datos del artículo.');
step(6, 'Haga clic en "Guardar Préstamo".');
gap(0.3);
h2('Datos del préstamo');
li('Monto prestado: cantidad de dinero que se entrega al cliente');
li('Tasa de interés (%): porcentaje de interés que se aplicará');
li('Número de cuotas: en cuántos pagos se dividirá la deuda');
li('Frecuencia de pago: diario, semanal, quincenal o mensual');
li('Sistema de cálculo: Francés (cuota fija) o Alemán (cuotas decrecientes)');
li('Fecha de inicio: fecha en que se entrega el dinero');
gap(0.3);
h2('Agregar una garantía (empeño)');
body('Si el cliente deja un artículo como garantía del préstamo, active la sección "Garantía Prendaria" y complete:');
li('Nombre del artículo (ej: televisor, laptop, reloj)');
li('Descripción del artículo y su estado');
li('Valor de tasación: cuánto vale el artículo');
li('Foto del artículo');
li('Fecha límite de custodia');
gap(0.3);
h2('Ver el cronograma de pagos');
body('Cada préstamo tiene un cronograma automático que muestra todas las fechas de pago, el monto de cada cuota y si ya fue pagada o no. Para verlo, haga clic en "Ver Cronograma" en el préstamo correspondiente.');
gap(0.3);
h2('Estados de un préstamo');
li('Vigente: el préstamo está activo y tiene pagos pendientes');
li('Pagado: el cliente liquidó toda la deuda');
li('Vencido: se pasó la fecha de pago sin que el cliente haya pagado');
gap(0.3);
warnBox('El sistema solo permite registrar un préstamo si la bóveda tiene suficiente capital disponible. Si no hay fondos, primero debe inyectarse capital en la sección Bóveda.');

// ─── 6. PAGOS ────────────────────────────────────────────────────────────────

newPage('Pagos');
h1('6.  MÓDULO DE PAGOS');
body('En este módulo se registran todos los pagos que realizan los clientes. El sistema calcula automáticamente el saldo pendiente y emite un recibo de pago.');
gap(0.4);
h2('Cómo registrar un pago');
step(1, 'Haga clic en "Pagos" en el menú lateral.');
step(2, 'Haga clic en "Registrar Pago".');
step(3, 'Seleccione el préstamo del cliente que está pagando.');
step(4, 'El sistema mostrará automáticamente el saldo pendiente total.');
step(5, 'Ingrese el monto que el cliente está entregando.');
step(6, 'Agregue una observación si lo considera necesario (opcional).');
step(7, 'Haga clic en "Guardar Pago".');
gap(0.3);
h2('Liquidación anticipada');
body('Si el cliente desea pagar toda la deuda de una sola vez antes de la fecha final, active la opción "Liquidación Anticipada". El sistema calculará el monto exacto que debe pagar incluyendo el interés proporcional hasta la fecha actual.');
gap(0.3);
h2('Recibo de pago');
body('Al registrar el pago, el sistema genera automáticamente un recibo. Puede imprimirlo haciendo clic en el botón "Imprimir Boleta" y entregárselo al cliente como comprobante.');
gap(0.3);
h2('¿Qué pasa cuando el préstamo queda saldado?');
li('El préstamo cambia automáticamente a estado "Pagado"');
li('Si tenía una garantía empeñada, el artículo queda disponible para ser devuelto al cliente');
li('El dinero del pago se suma automáticamente a la bóveda');
gap(0.3);
tipBox('El monto ingresado no puede ser mayor al saldo pendiente. Si el cliente quiere pagar más, use la opción de Liquidación Anticipada.');

// ─── 7. EMPEÑOS ──────────────────────────────────────────────────────────────

newPage('Empeños');
h1('7.  MÓDULO DE EMPEÑOS');
body('El módulo de empeños gestiona todos los artículos que los clientes dejan como garantía de sus préstamos. Aquí puede ver qué artículos están en custodia y cuándo están disponibles para ser devueltos.');
gap(0.4);
h2('¿Cómo se crean los empeños?');
body('Los empeños se crean automáticamente cuando se registra un préstamo con garantía. No es necesario crearlos manualmente en este módulo.');
gap(0.3);
h2('Ver los artículos en custodia');
body('Al ingresar al módulo de Empeños verá una galería con todos los artículos que están actualmente en custodia. Cada tarjeta muestra una foto del artículo, su nombre, el valor de tasación y el estado.');
gap(0.3);
h2('Estados de un empeño');
li('En custodia: el artículo está guardado y el préstamo aún no está pagado');
li('Rescatado: el cliente pagó su préstamo y el artículo puede ser devuelto');
li('Devuelto: el artículo ya fue entregado al cliente');
gap(0.3);
h2('Cómo devolver un artículo al cliente');
step(1, 'El préstamo vinculado debe estar completamente pagado.');
step(2, 'Ingrese al módulo de Empeños y busque el artículo.');
step(3, 'Haga clic en "Ver Detalle" del artículo.');
step(4, 'Haga clic en el botón "Devolver Artículo".');
step(5, 'El sistema marcará el artículo como devuelto.');
gap(0.3);
warnBox('No es posible devolver un artículo si el préstamo asociado aún tiene deuda pendiente. Primero debe registrarse el pago completo.');

// ─── 8. AHORROS ──────────────────────────────────────────────────────────────

newPage('Ahorros');
h1('8.  MÓDULO DE AHORROS');
body('Este módulo permite gestionar cuentas de ahorro para los clientes. Los clientes pueden depositar y retirar dinero, y el sistema lleva el registro de todos los movimientos.');
gap(0.4);
h2('Abrir una cuenta de ahorros');
step(1, 'Ingrese al módulo de Ahorros.');
step(2, 'Haga clic en "Nueva Cuenta".');
step(3, 'Seleccione el cliente (cada cliente solo puede tener una cuenta de ahorros).');
step(4, 'Defina la tasa de interés y el plazo en meses si aplica.');
step(5, 'Guarde para crear la cuenta.');
gap(0.3);
h2('Registrar un depósito o retiro');
step(1, 'En la lista de cuentas, haga clic en "Ver Cuenta" del cliente.');
step(2, 'Seleccione el tipo de movimiento: Depósito o Retiro.');
step(3, 'Ingrese el monto y una observación si lo desea.');
step(4, 'Haga clic en "Procesar". El saldo se actualizará automáticamente.');
gap(0.3);
h2('Ver historial de movimientos');
body('En el detalle de cada cuenta puede ver todos los depósitos y retiros realizados, con fecha, monto y observaciones.');
gap(0.3);
infoBox('Un cliente no puede retirar más dinero del que tiene disponible en su cuenta de ahorros. El sistema valida este límite automáticamente.');

// ─── 9. GASTOS ───────────────────────────────────────────────────────────────

newPage('Gastos');
h1('9.  MÓDULO DE GASTOS');
body('Este módulo registra todos los gastos operativos del negocio (pasajes, materiales, servicios, etc.). Cada gasto se descuenta automáticamente del capital disponible en la bóveda.');
gap(0.4);
h2('Registrar un gasto');
step(1, 'Ingrese al módulo de Gastos.');
step(2, 'Haga clic en "Nuevo Gasto".');
step(3, 'Escriba una descripción del gasto.');
step(4, 'Ingrese el monto.');
step(5, 'Seleccione la categoría (alquiler, servicios, materiales, etc.).');
step(6, 'Agregue una observación si lo necesita.');
step(7, 'Haga clic en "Guardar".');
gap(0.3);
h2('¿Qué pasa al registrar un gasto?');
li('El monto se descuenta automáticamente de la bóveda');
li('Se registra el nombre del usuario que creó el gasto');
li('La operación queda registrada en la bitácora');
gap(0.3);
h2('Eliminar un gasto (solo Administrador)');
body('Si se registró un gasto por error, el administrador puede eliminarlo. Al eliminarlo, el monto se devuelve automáticamente a la bóveda.');
gap(0.3);
warnBox('Solo se puede registrar un gasto si la bóveda tiene fondos suficientes. Si la bóveda está en cero o con poco saldo, primero inyecte capital.');

// ─── 10. CAJA ────────────────────────────────────────────────────────────────

newPage('Caja');
h1('10.  MÓDULO DE CAJA');
body('El corte de caja muestra un resumen detallado de todos los movimientos de dinero del día: cuánto entró, cuánto salió y cuál es el balance neto. Es ideal para hacer el cierre al final del día.');
gap(0.4);
h2('Cómo hacer un corte de caja');
step(1, 'Ingrese al módulo de Caja.');
step(2, 'Seleccione la fecha del corte (por defecto aparece el día de hoy).');
step(3, 'El sistema calculará automáticamente todos los movimientos del día.');
step(4, 'Para imprimir el reporte, haga clic en "Imprimir Cierre".');
gap(0.3);
h2('¿Qué incluye el reporte de caja?');
body('Ingresos del día:');
li('Cobros de préstamos (pagos recibidos de clientes)');
li('Depósitos en cuentas de ahorro');
gap(0.2);
body('Egresos del día:');
li('Préstamos entregados (dinero desembolsado)');
li('Retiros de cuentas de ahorro');
li('Gastos operativos registrados');
gap(0.3);
body('Al final muestra el balance neto: si el resultado es positivo, entró más dinero del que salió. Si es negativo, salió más de lo que entró.');
gap(0.3);
tipBox('Haga el corte de caja al final de cada jornada y guarde el PDF impreso como respaldo físico del día.');

// ─── 11. BÓVEDA ──────────────────────────────────────────────────────────────

newPage('Bóveda');
h1('11.  BÓVEDA (CAPITAL DISPONIBLE)');
body('La bóveda representa el capital total disponible del negocio para prestar. El sistema descuenta automáticamente cuando se otorga un préstamo o se registra un gasto, y agrega cuando se recibe un pago.');
gap(0.4);
h2('¿Qué muestra la bóveda?');
li('Saldo actual: dinero disponible para prestar en este momento');
li('Capital invertido: total del dinero que está prestado actualmente');
gap(0.3);
h2('Inyectar capital a la bóveda');
body('Cuando se necesite agregar dinero al sistema (capital inicial o reposición de fondos), el administrador puede inyectar capital:');
step(1, 'Ingrese al módulo Bóveda.');
step(2, 'Haga clic en "Inyectar Capital".');
step(3, 'Ingrese el monto que desea agregar.');
step(4, 'Haga clic en "Confirmar". El saldo se actualizará inmediatamente.');
gap(0.3);
h2('Movimientos automáticos de la bóveda');
li('Cuando se otorga un préstamo → se descuenta el monto prestado');
li('Cuando se recibe un pago → se suma el monto cobrado');
li('Cuando se registra un gasto → se descuenta el monto del gasto');
li('Cuando se hace un depósito de ahorro → se suma al saldo');
li('Cuando se hace un retiro de ahorro → se descuenta del saldo');
gap(0.3);
infoBox('La bóveda refleja en tiempo real el estado financiero del negocio. Revísela regularmente para asegurarse de tener fondos disponibles para nuevos préstamos.');

// ─── 12. USUARIOS ────────────────────────────────────────────────────────────

newPage('Usuarios');
h1('12.  MÓDULO DE USUARIOS');
body('Este módulo permite al administrador gestionar qué personas tienen acceso al sistema y qué pueden hacer. Solo el administrador tiene acceso a esta sección.');
gap(0.4);
h2('Tipos de usuarios (roles)');
li('Administrador (admin): acceso total a todas las funciones del sistema');
li('Operador: puede registrar clientes, préstamos y pagos');
li('Cajero: puede registrar pagos y hacer cortes de caja');
li('Consultor: solo puede ver información, no puede modificar nada');
gap(0.3);
h2('Crear un nuevo usuario');
step(1, 'Ingrese al módulo de Usuarios.');
step(2, 'Haga clic en "Nuevo Usuario".');
step(3, 'Complete el nombre completo, correo electrónico y contraseña (mínimo 8 caracteres).');
step(4, 'Seleccione el rol que tendrá el usuario.');
step(5, 'Haga clic en "Guardar".');
gap(0.3);
h2('Eliminar un usuario');
body('Haga clic en el botón "Eliminar" del usuario que desea remover del sistema. Tenga en cuenta que no puede eliminar su propia cuenta mientras está activo en el sistema.');
gap(0.3);
warnBox('Cree usuarios solo para el personal de confianza. Asigne el rol mínimo necesario para cada persona según sus funciones en el negocio.');

// ─── 13. SIMULADOR ───────────────────────────────────────────────────────────

newPage('Simulador');
h1('13.  SIMULADOR DE PRÉSTAMOS');
body('El simulador es una herramienta de cálculo que permite proyectar cómo quedaría un préstamo antes de registrarlo. Es útil para mostrarle al cliente cuánto pagaría y cuáles serían sus cuotas, sin comprometer ningún dato en el sistema.');
gap(0.4);
h2('Cómo usar el simulador');
step(1, 'Ingrese al módulo Simulador.');
step(2, 'Ingrese el monto que se desea prestar.');
step(3, 'Ingrese la tasa de interés (en porcentaje).');
step(4, 'Indique en cuántas cuotas se va a pagar.');
step(5, 'Seleccione la frecuencia (semanal, mensual, etc.).');
step(6, 'Elija el sistema de cálculo (Francés o Alemán).');
step(7, 'Haga clic en "Calcular". El sistema mostrará el cronograma completo.');
gap(0.3);
h2('¿Qué muestra el resultado?');
li('El valor de cada cuota');
li('Las fechas de cada pago proyectado');
li('El total de intereses que se pagarán');
li('El monto total a pagar al finalizar el préstamo');
gap(0.3);
tipBox('Use el simulador para negociar las condiciones del préstamo con el cliente. Una vez acordadas, registre el préstamo en el Módulo de Préstamos con los mismos datos.');
infoBox('El simulador no guarda ningún dato ni compromete fondos. Es solo una calculadora de referencia.');

// ─── 14. REPORTES ────────────────────────────────────────────────────────────

newPage('Reportes');
h1('14.  REPORTES Y DOCUMENTOS');
body('El sistema puede generar varios documentos en formato PDF y Excel. Estos documentos son útiles para entregar al cliente, archivar físicamente o presentar ante autoridades.');
gap(0.4);
h2('Documentos disponibles');

const docs = [
    ['Contrato de Préstamo', 'Documento legal con todas las cláusulas del préstamo, datos del deudor y acreedor, y espacio para firmas. Se genera desde el módulo de Préstamos.'],
    ['Cronograma de Pagos', 'Tabla detallada con todas las fechas de pago, montos de cada cuota y el estado (pagado, pendiente). Se genera desde el préstamo.'],
    ['Boleta de Pago', 'Recibo que se entrega al cliente al registrar cada pago. Incluye monto pagado, fecha y saldo restante.'],
    ['Estado de Cuenta', 'Resumen completo del cliente: todos sus préstamos, saldos, empeños y cuentas de ahorro.'],
    ['Cierre de Caja', 'Reporte del día con todos los ingresos y egresos y el balance final.'],
    ['Exportación Excel', 'Lista completa de préstamos en formato Excel para análisis externo.'],
];

docs.forEach(([title, desc]) => {
    guard(45);
    doc.fillColor(C.blue).fontSize(10).font('Helvetica-Bold').text(`▸  ${title}`, ML + 8, doc.y);
    doc.fillColor(C.dark).fontSize(10).font('Helvetica').text(desc, ML + 18, doc.y, { width: CW - 18, lineGap: 2 });
    doc.moveDown(0.4);
});

gap(0.3);
h2('Cómo imprimir o guardar un documento');
step(1, 'Ubique el registro que necesita (préstamo, pago, etc.).');
step(2, 'Haga clic en el botón "Imprimir" o "Descargar PDF" según corresponda.');
step(3, 'Se abrirá o descargará el archivo PDF automáticamente.');
step(4, 'Puede imprimirlo directamente o guardarlo en su computadora.');

// ─── 15. CONFIGURACIÓN ───────────────────────────────────────────────────────

newPage('Configuración');
h1('15.  CONFIGURACIÓN DEL SISTEMA');
body('En esta sección el administrador puede personalizar la información de la empresa que aparece en los documentos y reportes del sistema.');
gap(0.4);
h2('Datos que se pueden configurar');
li('Nombre de la empresa o financiera');
li('Número de RUC o identificación fiscal');
li('Dirección de la empresa');
li('Teléfono de contacto');
li('Correo electrónico de contacto');
li('Símbolo de moneda (S/, $, €, etc.)');
li('Logo de la empresa (aparecerá en los documentos PDF)');
gap(0.3);
h2('Cómo actualizar la configuración');
step(1, 'Ingrese al módulo de Configuración.');
step(2, 'Modifique los campos que desea actualizar.');
step(3, 'Si desea cambiar el logo, haga clic en el campo de imagen y seleccione el archivo.');
step(4, 'Haga clic en "Guardar Cambios".');
gap(0.3);
infoBox('Los cambios en la configuración se reflejan inmediatamente en todos los documentos que se generen a partir de ese momento.');
gap(0.3);
h2('Limpiar base de datos (solo Administrador)');
body('Esta opción permite borrar todos los datos del sistema (clientes, préstamos, pagos, etc.) para empezar desde cero. Es una operación irreversible.');
warnBox('La limpieza de base de datos borra TODA la información permanentemente. Antes de realizarla, descargue un respaldo desde el módulo de Backup. Esta acción requiere contraseña del administrador y una confirmación especial de seguridad.');

// ─── 16. BITÁCORA ────────────────────────────────────────────────────────────

newPage('Bitácora');
h1('16.  BITÁCORA');
body('La bitácora es el registro de auditoría del sistema. Guarda automáticamente un historial de todas las operaciones importantes que se realizan: quién las hizo, qué hizo y cuándo.');
gap(0.4);
h2('¿Para qué sirve la bitácora?');
li('Saber quién registró un préstamo o un pago');
li('Verificar si alguien inyectó o retiró capital de la bóveda');
li('Revisar en qué momento se realizó una operación específica');
li('Tener control y transparencia sobre las acciones del personal');
gap(0.3);
h2('¿Qué operaciones registra?');
li('Otorgamiento de préstamos');
li('Registro de cobros y pagos');
li('Depósitos y retiros de ahorros');
li('Inyecciones de capital a la bóveda');
li('Registro y eliminación de gastos');
li('Apertura de cuentas de ahorro');
gap(0.3);
infoBox('La bitácora es de solo lectura. Nadie puede modificar ni eliminar los registros de auditoría. Esto garantiza la integridad de la información.');

// ─── 17. BACKUP ──────────────────────────────────────────────────────────────

newPage('Respaldo / Backup');
h1('17.  RESPALDO (BACKUP)');
body('El módulo de Backup permite descargar una copia completa de toda la base de datos del sistema. Es importante hacer respaldos regularmente para proteger la información del negocio ante cualquier falla o accidente.');
gap(0.4);
h2('Cómo hacer un respaldo');
step(1, 'Ingrese al módulo de Backup (solo disponible para Administradores).');
step(2, 'Haga clic en el botón "Descargar Respaldo".');
step(3, 'El sistema descargará automáticamente un archivo con el nombre del respaldo y la fecha.');
step(4, 'Guarde ese archivo en un lugar seguro: un USB, disco externo o nube.');
gap(0.3);
h2('¿Con qué frecuencia hacer respaldos?');
li('Idealmente: al finalizar cada jornada de trabajo');
li('Como mínimo: una vez por semana');
li('Siempre: antes de hacer cualquier cambio importante en la configuración');
gap(0.3);
h2('¿Cómo restaurar un respaldo?');
body('Si necesita restaurar un respaldo, el archivo descargado (con extensión .db) puede ser visualizado con el programa "DB Browser for SQLite". Para restaurar completamente, contacte al administrador técnico del sistema.');
gap(0.3);
tipBox('Guarde los respaldos en al menos dos lugares distintos (ej: un USB Y una carpeta en la nube). Así si falla uno, tiene el otro.');

// ─── 18. CONSEJOS ────────────────────────────────────────────────────────────

newPage('Consejos y buenas prácticas');
h1('18.  CONSEJOS Y BUENAS PRÁCTICAS');
gap(0.3);
h2('Rutina diaria recomendada');
step(1, 'Al comenzar: revise el Panel Principal para ver alertas de préstamos vencidos.');
step(2, 'Durante el día: registre cada cobro y operación al momento de realizarlos.');
step(3, 'Al finalizar: haga el corte de caja e imprímalo como respaldo del día.');
step(4, 'Al cerrar: descargue un respaldo de la base de datos.');
gap(0.4);
h2('Seguridad');
li('No comparta su contraseña con otras personas');
li('Cierre su sesión si se aleja del equipo');
li('Use contraseñas seguras (mezcle letras, números y símbolos)');
li('Solo el administrador debe tener acceso al módulo de Usuarios y Configuración');
gap(0.4);
h2('Preguntas frecuentes');
guard(30);
doc.fillColor(C.blue).fontSize(10).font('Helvetica-Bold').text('¿Por qué no puedo crear un préstamo?', ML, doc.y);
body('La bóveda no tiene fondos suficientes. Pida al administrador que inyecte capital antes de continuar.');
guard(30);
doc.fillColor(C.blue).fontSize(10).font('Helvetica-Bold').text('¿Por qué no puedo devolver un empeño?', ML, doc.y);
body('El préstamo vinculado al empeño aún tiene saldo pendiente. Registre el pago completo primero.');
guard(30);
doc.fillColor(C.blue).fontSize(10).font('Helvetica-Bold').text('¿Qué hago si el sistema no abre?', ML, doc.y);
body('Ciérrelo completamente desde la barra de tareas y ábralo nuevamente. Si el problema persiste, reinicie el equipo.');
guard(30);
doc.fillColor(C.blue).fontSize(10).font('Helvetica-Bold').text('¿Puedo usar el sistema en varios equipos al mismo tiempo?', ML, doc.y);
body('No. Este sistema está diseñado para instalarse y usarse en un solo equipo. Cada equipo tiene su propia base de datos independiente.');
guard(30);
doc.fillColor(C.blue).fontSize(10).font('Helvetica-Bold').text('¿Qué hago si olvidé mi contraseña?', ML, doc.y);
body('Contacte al administrador del sistema. Él puede crear una nueva contraseña para su cuenta desde el Módulo de Usuarios.');

gap(0.8);
// Closing box
guard(80);
const cy = doc.y;
doc.rect(ML, cy, CW, 70).fill(C.primary);
doc.fillColor(C.white).fontSize(13).font('Helvetica-Bold');
doc.text('¿Necesita ayuda adicional?', ML + 16, cy + 12, { width: CW - 32 });
doc.fillColor(C.accent).fontSize(10).font('Helvetica');
doc.text('Si tiene alguna duda que no está en este manual, comuníquese con el\nadministrador del sistema o con el soporte técnico de MISACORP.', ML + 16, cy + 30, { width: CW - 32, lineGap: 3 });
doc.fillColor(C.dark);
doc.y = cy + 78;

// ─── PAGE NUMBERS ─────────────────────────────────────────────────────────────

const range = doc.bufferedPageRange();
for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i);
    if (i === 0) continue; // skip cover
    doc.fillColor(C.gray).fontSize(9).font('Helvetica');
    doc.text(`${i}`, ML, PAGE_H - 35, { align: 'center', width: CW });
}

doc.end();

doc.on('end', () => {
    console.log('✅ Manual generado: Manual_Sistema_Prestamos_MISACORP.pdf');
});
