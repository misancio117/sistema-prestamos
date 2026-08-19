const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const PrestamoModel = require('../models/PrestamoModel');
const PagoModel = require('../models/PagoModel');
const ConfigModel = require('../models/ConfigModel');
const ClienteModel = require('../models/ClienteModel');
const AhorroModel = require('../models/AhorroModel');
const EmpenoModel = require('../models/EmpenoModel');
const ReporteAvanzadoModel = require('../models/ReporteAvanzadoModel');
const finance = require('../utils/finance');

/* ── helpers ───────────────────────────────────────────────────── */
function getConfig() {
    return ConfigModel.obtener() || { nombre_empresa: 'Sistema', moneda: '$', ruc: '', direccion: '' };
}

function applyHeaderStyle(row) {
    row.height = 22;
    row.eachCell(cell => {
        cell.font      = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
        cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border    = { bottom: { style: 'thin', color: { argb: 'FF3B82F6' } } };
    });
}

function applyTotalStyle(row) {
    row.eachCell(cell => {
        cell.font = { bold: true, size: 10 };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3CD' } };
    });
}

const MONEDA_FMT = '#,##0.00';

/* ── estado color para Excel ────────────────────────────────────── */
const estadoColor = { vencido: 'FFEF4444', pagado: 'FF10B981', pendiente: 'FFF59E0B', en_custodia: 'FF3B82F6', rescatado: 'FF10B981' };

const reportesController = {

    /* ── 1. CONTRATO PDF ─────────────────────────────────────────── */
    generarContrato: (req, res) => {
        const { id } = req.params;
        try {
            const prestamo = PrestamoModel.obtenerPorId(id);
            const empeno   = EmpenoModel.obtenerPorPrestamo(id);
            const config   = getConfig();
            const moneda   = config.moneda;

            if (!prestamo) return res.redirect('/prestamos');

            const doc = new PDFDocument({ margin: 72, size: 'A4' });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename=Contrato_Prestamo_${id}.pdf`);
            doc.pipe(res);

            if (config.logo) try { doc.image(`public/uploads/${config.logo}`, 72, 50, { width: 70 }); } catch(e){}
            doc.moveDown(2);
            doc.fontSize(14).font('Times-Bold').text('CONTRATO DE PRÉSTAMO DE DINERO', { align: 'center' });
            if (empeno) doc.fontSize(14).font('Times-Bold').text('CON GARANTÍA PRENDARIA', { align: 'center' });
            doc.moveDown(0.5);
            doc.fontSize(11).font('Times-Roman').text(`NRO OPERACIÓN: 0000${prestamo.id}`, { align: 'center' });
            doc.moveDown(2);

            doc.fontSize(12).font('Times-Roman');
            const fechaIngreso = new Date(prestamo.fecha_inicio).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
            doc.text(`Conste por el presente documento privado de Préstamo de Dinero, que se celebra en la localidad de operación, a los ${fechaIngreso}, entre las siguientes partes:`, { align: 'justify', lineGap: 8 });
            doc.moveDown(1);

            doc.font('Times-Bold').text('SECCIÓN I: DE LAS PARTES', { underline: true });
            doc.moveDown(0.5);
            doc.font('Times-Bold').text('1.1. EL ACREEDOR: ', { continued: true });
            doc.font('Times-Roman').text(`La entidad financiera "${config.nombre_empresa}", con RUC ${config.ruc || 'S/N'}, domiciliada en ${config.direccion || 'su oficina principal'}.`);
            doc.moveDown(0.5);
            doc.font('Times-Bold').text('1.2. EL DEUDOR: ', { continued: true });
            doc.font('Times-Roman').text(`El/La señor(a) ${prestamo.nombre} ${prestamo.apellido}, mayor de edad, identificado(a) con DNI N° ${prestamo.dni}, con número de contacto ${prestamo.telefono || 'No registrado'}.`);
            doc.moveDown(1.5);

            doc.font('Times-Bold').text('SECCIÓN II: CLÁUSULAS DEL CONTRATO', { underline: true });
            doc.moveDown(0.5);
            doc.font('Times-Bold').text('PRIMERA (DEL PRÉSTAMO Y LA GARANTÍA): ', { continued: true });
            doc.font('Times-Roman').text(`EL ACREEDOR otorga a EL DEUDOR la suma líquida de ${moneda} ${parseFloat(prestamo.monto_prestado).toFixed(2)} en calidad de préstamo personal. `, { continued: !!empeno, align: 'justify', lineGap: 8 });
            if (empeno) doc.text(`Asimismo, EL DEUDOR declara dejar en calidad de garantía prendaria un(a) ${empeno.nombre_articulo}, el cual garantiza el cumplimiento íntegro del pago y queda bajo la custodia temporal de EL ACREEDOR hasta la cancelación total de la deuda.`, { align: 'justify', lineGap: 8 });
            doc.moveDown(0.5);
            doc.font('Times-Bold').text('SEGUNDA (DE LA DEVOLUCIÓN Y LOS INTERESES): ', { continued: true });
            doc.font('Times-Roman').text(`EL DEUDOR se compromete expresa e irrevocablemente a devolver la suma de capital sumada a los intereses devengados, haciendo un Total a Pagar de ${moneda} ${parseFloat(prestamo.monto_total).toFixed(2)}, pactado bajo una tasa de interés del ${parseFloat(prestamo.tasa_interes).toFixed(2)}%.`, { align: 'justify', lineGap: 8 });
            doc.moveDown(0.5);
            doc.font('Times-Bold').text('TERCERA (MODALIDAD DE PAGO): ', { continued: true });
            doc.font('Times-Roman').text(`El pago de la deuda será fragmentado en ${prestamo.cuotas} cuota(s) de periodicidad ${prestamo.frecuencia.toUpperCase()}, de acuerdo al cronograma oficial detallado y entregado de forma adjunta a este contrato.`, { align: 'justify', lineGap: 8 });
            doc.moveDown(0.5);
            doc.font('Times-Bold').text('CUARTA (INCUMPLIMIENTO): ', { continued: true });
            doc.font('Times-Roman').text(`En caso de incumplimiento en el pago de las cuotas establecidas o de mora al final del período, EL ACREEDOR queda plenamente facultado para tomar acciones de cobranza. `, { continued: !!empeno, align: 'justify', lineGap: 8 });
            if (empeno) doc.text(`De no subsanarse la deuda, EL ACREEDOR podrá disponer del bien prendado (${empeno.nombre_articulo}), ponerlo en venta o remate para recuperar el capital prestado.`, { align: 'justify', lineGap: 8 });
            doc.moveDown(0.5);
            doc.font('Times-Bold').text('QUINTA (CONFORMIDAD): ', { continued: true });
            doc.font('Times-Roman').text(`Ambas partes declaran su total conformidad con las cláusulas expresadas en el presente documento, suscribiéndolo en señal de aceptación.`, { align: 'justify', lineGap: 8 });
            doc.moveDown(2);

            if (doc.y > 600) { doc.addPage(); doc.y = 100; } else { doc.y += 40; }
            const startY = doc.y;
            doc.text('_________________________________', 72, startY);
            doc.text('_________________________________', 300, startY);
            doc.font('Times-Bold');
            doc.text('EL ACREEDOR', 120, startY + 15);
            doc.text('EL DEUDOR', 350, startY + 15);
            doc.font('Times-Roman').fontSize(10);
            doc.text(config.nombre_empresa.toUpperCase(), 72, startY + 30, { width: 170, align: 'center' });
            doc.text(`${prestamo.nombre.toUpperCase()} ${prestamo.apellido.toUpperCase()}`, 300, startY + 30, { width: 170, align: 'center' });
            doc.text(`DNI: ${prestamo.dni}`, 300, startY + 45, { width: 170, align: 'center' });
            doc.end();
        } catch (error) {
            console.error('Error PDF Contrato:', error);
            res.redirect('/prestamos');
        }
    },

    /* ── 2. TICKET PAGO ──────────────────────────────────────────── */
    generarTicket: (req, res) => {
        const { id } = req.params;
        try {
            const pago   = PagoModel.obtenerDetalle(id);
            const config = getConfig();
            if (!pago) return res.redirect('/prestamos');

            const doc = new PDFDocument({ size: [226, 400], margin: 10 });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename=Ticket_${id}.pdf`);
            doc.pipe(res);

            if (config.logo) try { doc.image(`public/uploads/${config.logo}`, 90, 10, { width: 40 }); doc.moveDown(4); } catch(e){}
            doc.fontSize(10).font('Times-Bold').text(config.nombre_empresa.toUpperCase(), { align: 'center' });
            doc.text('--------------------------------', { align: 'center' });
            doc.fontSize(12).text(`TOTAL: ${config.moneda} ${parseFloat(pago.monto_pagado).toFixed(2)}`, { align: 'center' });
            doc.end();
        } catch (error) { res.redirect('/prestamos'); }
    },

    /* ── 3. CRONOGRAMA PDF ───────────────────────────────────────── */
    generarCronogramaPDF: (req, res) => {
        const { id } = req.params;
        try {
            const prestamo = PrestamoModel.obtenerPorId(id);
            const pagos    = PagoModel.obtenerHistorial(id);
            const config   = getConfig();
            const moneda   = config.moneda;
            if (!prestamo) return res.redirect('/prestamos');

            const plan = finance.calcularPlan(
                parseFloat(prestamo.monto_prestado), parseFloat(prestamo.tasa_interes),
                prestamo.cuotas, prestamo.frecuencia, prestamo.fecha_inicio,
                prestamo.sistema_pago || 'frances', prestamo.fecha_primer_cobro
            );
            const cronograma = plan.cronograma;

            const totalPagado = pagos.reduce((s, p) => s + parseFloat(p.monto_pagado), 0);
            let pagadoRestante = totalPagado;
            cronograma.forEach(c => {
                if (pagadoRestante >= c.monto - 0.01)  { c.estado = 'PAGADO';     pagadoRestante -= c.monto; }
                else if (pagadoRestante > 0)            { c.estado = 'PARCIAL';    pagadoRestante = 0; }
                else                                    { c.estado = 'PROGRAMADO'; }
            });

            const doc = new PDFDocument({ margin: 40, size: 'A4' });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename=Cronograma_${id}.pdf`);
            doc.pipe(res);

            doc.rect(0, 0, doc.page.width, 100).fill('#0f172a');
            if (config.logo) try { doc.image(`public/uploads/${config.logo}`, 40, 25, { width: 50 }); } catch(e){}
            doc.fillColor('#ffffff').fontSize(22).font('Times-Bold').text('CRONOGRAMA OFICIAL DE PAGOS', 110, 35);
            doc.fontSize(10).font('Times-Roman').text(config.nombre_empresa.toUpperCase(), 110, 60);
            doc.fillColor('#000000').moveDown(4);

            doc.rect(40, 120, doc.page.width - 80, 75).fillAndStroke('#f8fafc', '#94a3b8');
            doc.fillColor('#0f172a').fontSize(11).font('Times-Bold').text('DATOS DEL CLIENTE', 60, 130);
            doc.fillColor('#334155').font('Times-Roman').fontSize(10).text(`Titular: ${prestamo.nombre} ${prestamo.apellido}`, 60, 150).text(`Documento: ${prestamo.dni}`, 60, 170);
            doc.fillColor('#0f172a').fontSize(11).font('Times-Bold').text('DETALLES DEL CRÉDITO', 240, 130);
            doc.fillColor('#334155').font('Times-Roman').fontSize(10).text(`Monto Prestado: ${moneda} ${parseFloat(prestamo.monto_prestado).toFixed(2)}`, 240, 150).text(`Monto Total (c/Int): ${moneda} ${parseFloat(prestamo.monto_total).toFixed(2)}`, 240, 170);
            doc.fillColor('#0f172a').fontSize(11).font('Times-Bold').text('ESTADO ACTUAL', 410, 130);
            doc.fillColor('#334155').font('Times-Roman').fontSize(10).text(`Préstamo N°: 0000${prestamo.id}`, 410, 150).text(`Frecuencia: ${prestamo.frecuencia.toUpperCase()}`, 410, 170);
            doc.moveTo(225, 130).lineTo(225, 185).strokeColor('#cbd5e1').stroke();
            doc.moveTo(395, 130).lineTo(395, 185).strokeColor('#cbd5e1').stroke();

            let currentY = 220;
            const drawTableHeader = (y) => {
                doc.rect(40, y, doc.page.width - 80, 25).fillAndStroke('#3b82f6', '#2563eb');
                doc.fillColor('#ffffff').fontSize(10).font('Times-Bold');
                doc.text('N°', 50, y + 7); doc.text('FECHA', 100, y + 7); doc.text('AMORT.', 200, y + 7);
                doc.text('INTERÉS', 280, y + 7); doc.text('CUOTA FINAL', 360, y + 7); doc.text('ESTADO', 460, y + 7);
            };
            drawTableHeader(currentY);
            currentY += 25;

            doc.font('Times-Roman').fontSize(10);
            cronograma.forEach((c, idx) => {
                if (currentY > 750) { doc.addPage(); currentY = 50; drawTableHeader(currentY); currentY += 25; doc.font('Times-Roman').fontSize(10); }
                if (idx % 2 === 0) doc.rect(40, currentY, doc.page.width - 80, 20).fill('#f8fafc');
                else               doc.rect(40, currentY, doc.page.width - 80, 20).fill('#ffffff');
                doc.moveTo(40, currentY).lineTo(40, currentY + 20).strokeColor('#cbd5e1').stroke();
                doc.moveTo(doc.page.width - 40, currentY).lineTo(doc.page.width - 40, currentY + 20).strokeColor('#cbd5e1').stroke();
                doc.moveTo(40, currentY + 20).lineTo(doc.page.width - 40, currentY + 20).strokeColor('#e2e8f0').stroke();

                const ry = currentY + 5;
                doc.fillColor('#333333').text(c.numero.toString(), 50, ry).text(c.fecha.toLocaleDateString(), 100, ry);
                doc.fillColor('#64748b').text(`${moneda} ${(c.amortizacion || 0).toFixed(2)}`, 200, ry);
                doc.fillColor('#f59e0b').text(`${moneda} ${(c.interes || 0).toFixed(2)}`, 280, ry);
                doc.fillColor('#333333').font('Times-Bold').text(`${moneda} ${c.monto.toFixed(2)}`, 360, ry);
                doc.font('Times-Roman');
                const ec = c.estado === 'PAGADO' ? '#16a34a' : c.estado === 'PARCIAL' ? '#ea580c' : '#64748b';
                doc.fillColor(ec).font('Times-Bold').text(c.estado, 460, ry);
                doc.font('Times-Roman');
                currentY += 20;
            });

            currentY += 20;
            if (currentY > 750) { doc.addPage(); currentY = 50; }
            doc.rect(40, currentY, doc.page.width - 80, 40).fillAndStroke('#f1f5f9', '#cbd5e1');
            doc.fillColor('#000000').font('Times-Bold').fontSize(12).text(`TOTAL PAGADO: ${moneda} ${totalPagado.toFixed(2)}`, 60, currentY + 15);
            let restante = Math.max(0, parseFloat(prestamo.monto_total) - totalPagado);
            doc.fillColor('#dc2626').text(`SALDO PENDIENTE: ${moneda} ${restante.toFixed(2)}`, 300, currentY + 15);
            doc.end();
        } catch (error) {
            console.error('Error Cronograma PDF:', error);
            res.redirect('/prestamos');
        }
    },

    /* ── 4. ESTADO DE CUENTA ─────────────────────────────────────── */
    generarEstadoCuenta: (req, res) => {
        const { id } = req.params;
        try {
            const cliente  = ClienteModel.obtenerPorId(id);
            const prestamos = PrestamoModel.obtenerPorCliente(id);
            const ahorros  = AhorroModel.buscarPorCliente(id);
            const empenos  = EmpenoModel.obtenerPorCliente(id);
            const config   = getConfig();
            if (!cliente) return res.redirect('/clientes');

            const doc = new PDFDocument({ margin: 72, size: 'A4' });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename=EstadoCuenta_${id}.pdf`);
            doc.pipe(res);

            if (config.logo) try { doc.image(`public/uploads/${config.logo}`, 72, 50, { width: 60 }); } catch(e){}
            doc.fontSize(18).font('Times-Bold').text('ESTADO DE CUENTA INTEGRAL', { align: 'center' });
            doc.fontSize(10).font('Times-Roman').text(config.nombre_empresa, { align: 'center' });
            doc.text(`Fecha: ${new Date().toLocaleDateString()}`, { align: 'center' });
            doc.y = 160;

            doc.rect(72, doc.y, 450, 70).fillAndStroke('#f8f9fa', '#dee2e6');
            const sy = doc.y;
            doc.fill('#000').fontSize(12).font('Times-Bold').text(`CLIENTE: ${cliente.nombre} ${cliente.apellido}`, 82, sy + 15);
            doc.fontSize(10).font('Times-Roman').text(`DNI: ${cliente.dni}`, 82, sy + 35);
            doc.y = sy + 90;
            doc.font('Times-Bold').fontSize(14).text('RESUMEN FINANCIERO', 72, doc.y);
            doc.moveDown(1);

            let y = doc.y;
            doc.fontSize(12).font('Times-Bold').text('1. CUENTA DE AHORROS', 72, y);
            y += 20; doc.font('Times-Roman');
            if (ahorros) doc.fontSize(12).text(`Saldo Disponible: ${config.moneda} ${parseFloat(ahorros.saldo_actual).toFixed(2)}`, 72, y);
            else         doc.fontSize(10).text('No tiene cuenta de ahorros activa.', 72, y);
            y += 40;

            doc.font('Times-Bold').fontSize(12).text('2. PRÉSTAMOS ACTIVOS', 72, y);
            y += 20;
            doc.fontSize(10).text('ID', 72, y); doc.text('Fecha', 120, y); doc.text('Monto Total', 240, y); doc.text('Estado', 370, y);
            doc.moveTo(72, y + 15).lineTo(522, y + 15).stroke();
            y += 20;

            let totalDeuda = 0, hayDeuda = false;
            doc.font('Times-Roman');
            prestamos.forEach(p => {
                if (p.estado !== 'pagado') {
                    hayDeuda = true;
                    doc.text(`#${p.id}`, 72, y); doc.text(new Date(p.fecha_inicio).toLocaleDateString(), 120, y);
                    doc.text(`${config.moneda} ${parseFloat(p.monto_total).toFixed(2)}`, 240, y); doc.text(p.estado.toUpperCase(), 370, y);
                    y += 15; totalDeuda += parseFloat(p.monto_total);
                }
            });
            if (!hayDeuda) { doc.text('Sin deudas pendientes.', 72, y); y += 20; }
            else { y += 10; doc.font('Times-Bold').text(`Total Deuda: ${config.moneda} ${totalDeuda.toFixed(2)}`, 72, y); y += 20; }
            y += 20;

            if (y > 650) { doc.addPage(); y = 50; }
            doc.font('Times-Bold').fontSize(12).text('3. ARTÍCULOS EN GARANTÍA', 72, y);
            y += 20;
            if (empenos.length > 0) {
                let hay = false;
                doc.font('Times-Roman').fontSize(10);
                empenos.forEach(e => {
                    if (e.estado === 'en_custodia') { hay = true; doc.text(`- ${e.nombre_articulo} (${config.moneda} ${e.valor_tasacion})`, 72, y); y += 15; }
                });
                if (!hay) doc.text('No hay artículos en custodia.', 72, y);
            } else { doc.font('Times-Roman').fontSize(10).text('No hay historial de garantías.', 72, y); }
            doc.end();
        } catch (error) { res.redirect('/clientes'); }
    },

    /* ── 5. EXCEL SIMPLE (ruta legacy) ──────────────────────────── */
    exportarExcelPrestamos: async (req, res) => {
        try {
            const prestamos = PrestamoModel.obtenerTodos();
            const config    = getConfig();
            const workbook  = new ExcelJS.Workbook();
            const ws        = workbook.addWorksheet('Préstamos');
            ws.columns = [
                { header: 'ID', key: 'id', width: 8 }, { header: 'Cliente', key: 'cliente', width: 30 },
                { header: 'DNI', key: 'dni', width: 15 }, { header: `Monto Prestado (${config.moneda})`, key: 'monto', width: 20 },
                { header: 'Interés (%)', key: 'interes', width: 14 }, { header: `Total a Pagar (${config.moneda})`, key: 'total', width: 20 },
                { header: 'Fecha Inicio', key: 'fecha', width: 14 }, { header: 'Cuotas', key: 'cuotas', width: 10 },
                { header: 'Frecuencia', key: 'frecuencia', width: 14 }, { header: 'Estado', key: 'estado', width: 14 }
            ];
            applyHeaderStyle(ws.getRow(1));
            prestamos.forEach(p => {
                const row = ws.addRow({ id: p.id, cliente: `${p.nombre} ${p.apellido}`, dni: p.dni, monto: parseFloat(p.monto_prestado), interes: parseFloat(p.tasa_interes), total: parseFloat(p.monto_total), fecha: new Date(p.fecha_inicio).toLocaleDateString('es-ES'), cuotas: p.cuotas, frecuencia: p.frecuencia.toUpperCase(), estado: p.estado.toUpperCase() });
                row.getCell('monto').numFmt = MONEDA_FMT; row.getCell('total').numFmt = MONEDA_FMT;
            });
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=Reporte_Prestamos_Completo.xlsx');
            await workbook.xlsx.write(res); res.end();
        } catch (error) { res.redirect('/prestamos'); }
    },

    /* ── 6. PANEL ────────────────────────────────────────────────── */
    mostrarPanel: (req, res) => {
        res.render('reportes/panel', { pageTitle: 'Centro de Reportes' });
    },

    /* ── 7. PREVIEW AJAX ─────────────────────────────────────────── */
    previewReporte: (req, res) => {
        const { tipo_reporte, fecha_inicio, fecha_fin } = req.body;
        try {
            let stats = [];

            if (tipo_reporte === 'prestamos') {
                const d = ReporteAvanzadoModel.prestamosPorFecha(fecha_inicio, fecha_fin);
                const capital   = d.reduce((s, x) => s + parseFloat(x.monto_prestado || 0), 0);
                const intereses = d.reduce((s, x) => s + parseFloat(x.monto_total || 0) - parseFloat(x.monto_prestado || 0), 0);
                const pendientes = d.filter(x => x.estado === 'pendiente').length;
                stats = [
                    { label: 'Préstamos', value: d.length, icon: 'bi-cash-stack', hex: '#3b82f6' },
                    { label: 'Capital Otorgado', value: capital, money: true, icon: 'bi-bank', hex: '#3b82f6' },
                    { label: 'Intereses Esperados', value: intereses, money: true, icon: 'bi-percent', hex: '#10b981' },
                    { label: 'Pendientes', value: pendientes, icon: 'bi-clock', hex: '#f59e0b' },
                ];

            } else if (tipo_reporte === 'pagos') {
                const d = ReporteAvanzadoModel.pagosPorFecha(fecha_inicio, fecha_fin);
                const total = d.reduce((s, x) => s + parseFloat(x.monto_pagado || 0), 0);
                stats = [
                    { label: 'Cobros Registrados', value: d.length, icon: 'bi-wallet2', hex: '#10b981' },
                    { label: 'Total Recaudado', value: total, money: true, icon: 'bi-cash-coin', hex: '#10b981' },
                ];

            } else if (tipo_reporte === 'gastos') {
                const d = ReporteAvanzadoModel.gastosPorFecha(fecha_inicio, fecha_fin);
                const total = d.reduce((s, x) => s + parseFloat(x.monto || 0), 0);
                stats = [
                    { label: 'Gastos Registrados', value: d.length, icon: 'bi-graph-down', hex: '#ef4444' },
                    { label: 'Total Egresos', value: total, money: true, icon: 'bi-arrow-up-circle', hex: '#ef4444' },
                ];

            } else if (tipo_reporte === 'cartera_vencida') {
                const d = ReporteAvanzadoModel.carteraVencida();
                const pendiente = d.reduce((s, x) => s + parseFloat(x.saldo_pendiente || 0), 0);
                const diasProm  = d.length > 0 ? Math.round(d.reduce((s, x) => s + (x.dias_mora || 0), 0) / d.length) : 0;
                stats = [
                    { label: 'Préstamos Vencidos', value: d.length, icon: 'bi-exclamation-triangle', hex: '#ef4444' },
                    { label: 'Saldo Total Pendiente', value: pendiente, money: true, icon: 'bi-cash-coin', hex: '#ef4444' },
                    { label: 'Promedio Días Mora', value: diasProm + ' días', icon: 'bi-calendar-x', hex: '#f59e0b' },
                ];

            } else if (tipo_reporte === 'empenos') {
                const d = ReporteAvanzadoModel.empenosPorFecha(fecha_inicio, fecha_fin);
                const totalTas  = d.reduce((s, x) => s + parseFloat(x.valor_tasacion || 0), 0);
                const custodia  = d.filter(x => x.estado === 'en_custodia').length;
                stats = [
                    { label: 'Empeños', value: d.length, icon: 'bi-gem', hex: '#8b5cf6' },
                    { label: 'Valor Total Tasado', value: totalTas, money: true, icon: 'bi-tag', hex: '#8b5cf6' },
                    { label: 'En Custodia', value: custodia, icon: 'bi-lock', hex: '#f59e0b' },
                ];

            } else if (tipo_reporte === 'ahorros') {
                const d = ReporteAvanzadoModel.ahorrosPorFecha(fecha_inicio, fecha_fin);
                const dep = d.filter(x => x.tipo_movimiento === 'deposito').reduce((s, x) => s + parseFloat(x.monto || 0), 0);
                const ret = d.filter(x => x.tipo_movimiento === 'retiro').reduce((s, x) => s + parseFloat(x.monto || 0), 0);
                stats = [
                    { label: 'Movimientos', value: d.length, icon: 'bi-piggy-bank', hex: '#10b981' },
                    { label: 'Total Depósitos', value: dep, money: true, icon: 'bi-arrow-down-circle', hex: '#10b981' },
                    { label: 'Total Retiros', value: ret, money: true, icon: 'bi-arrow-up-circle', hex: '#ef4444' },
                    { label: 'Saldo Neto', value: dep - ret, money: true, icon: 'bi-graph-up', hex: dep - ret >= 0 ? '#10b981' : '#ef4444' },
                ];

            } else if (tipo_reporte === 'rentabilidad') {
                const d = ReporteAvanzadoModel.rentabilidadPorFecha(fecha_inicio, fecha_fin);
                stats = [
                    { label: 'Total Cobrado', value: d.totalCobrado, money: true, icon: 'bi-arrow-down-circle', hex: '#10b981' },
                    { label: 'Total Gastos', value: d.totalGastos, money: true, icon: 'bi-arrow-up-circle', hex: '#ef4444' },
                    { label: 'Utilidad Neta', value: d.utilidadNeta, money: true, icon: 'bi-graph-up-arrow', hex: d.utilidadNeta >= 0 ? '#10b981' : '#ef4444' },
                    { label: 'Préstamos Otorgados', value: d.prestamosOtorgados, icon: 'bi-cash-stack', hex: '#3b82f6' },
                ];
            }

            res.json({ ok: true, tipo: tipo_reporte, desde: fecha_inicio, hasta: fecha_fin, stats });
        } catch(e) {
            console.error('Preview error:', e);
            res.json({ ok: false, error: 'Error al calcular vista previa' });
        }
    },

    /* ── 8. DESCARGAR EXCEL (panel) ──────────────────────────────── */
    descargarReporteExcel: async (req, res) => {
        const { tipo_reporte, fecha_inicio, fecha_fin } = req.body;
        try {
            const config   = getConfig();
            const moneda   = config.moneda;
            const workbook = new ExcelJS.Workbook();
            workbook.creator = config.nombre_empresa;
            workbook.created = new Date();

            const addTotalsRow = (ws, col, datos, key) => {
                const total = datos.reduce((s, d) => s + parseFloat(d[key] || 0), 0);
                const totRow = ws.addRow({ [col]: total });
                totRow.getCell(col).numFmt = MONEDA_FMT;
                applyTotalStyle(totRow);
                return totRow;
            };

            /* ---- COLOCACIONES ---- */
            if (tipo_reporte === 'prestamos') {
                const datos = ReporteAvanzadoModel.prestamosPorFecha(fecha_inicio, fecha_fin);
                const ws    = workbook.addWorksheet('Préstamos');
                ws.columns = [
                    { header: 'ID', key: 'id', width: 8 },
                    { header: 'Cliente', key: 'cliente', width: 28 },
                    { header: 'DNI', key: 'dni', width: 14 },
                    { header: `Capital (${moneda})`, key: 'monto', width: 18 },
                    { header: `Total c/Int (${moneda})`, key: 'total', width: 18 },
                    { header: 'Tasa %', key: 'tasa', width: 10 },
                    { header: 'Cuotas', key: 'cuotas', width: 9 },
                    { header: 'Frecuencia', key: 'freq', width: 13 },
                    { header: 'Fecha', key: 'fecha', width: 13 },
                    { header: 'Estado', key: 'estado', width: 13 },
                ];
                applyHeaderStyle(ws.getRow(1));
                datos.forEach(d => {
                    const row = ws.addRow({ id: d.id, cliente: `${d.nombre} ${d.apellido}`, dni: d.dni, monto: parseFloat(d.monto_prestado), total: parseFloat(d.monto_total), tasa: parseFloat(d.tasa_interes), cuotas: d.cuotas, freq: d.frecuencia.toUpperCase(), fecha: new Date(d.fecha_inicio).toLocaleDateString('es-ES'), estado: d.estado.toUpperCase() });
                    row.getCell('monto').numFmt = MONEDA_FMT; row.getCell('total').numFmt = MONEDA_FMT;
                    const color = estadoColor[d.estado];
                    if (color) { row.getCell('estado').font = { bold: true, color: { argb: color } }; }
                });
                if (datos.length > 0) {
                    const totCapital = datos.reduce((s, d) => s + parseFloat(d.monto_prestado), 0);
                    const totTotal   = datos.reduce((s, d) => s + parseFloat(d.monto_total), 0);
                    const tr = ws.addRow({ id: '', cliente: `TOTAL (${datos.length} registros)`, dni: '', monto: totCapital, total: totTotal });
                    tr.getCell('monto').numFmt = MONEDA_FMT; tr.getCell('total').numFmt = MONEDA_FMT;
                    applyTotalStyle(tr);
                }

            /* ---- RECAUDOS ---- */
            } else if (tipo_reporte === 'pagos') {
                const datos = ReporteAvanzadoModel.pagosPorFecha(fecha_inicio, fecha_fin);
                const ws    = workbook.addWorksheet('Cobros');
                ws.columns = [
                    { header: 'ID Pago', key: 'id', width: 10 },
                    { header: 'Fecha', key: 'fecha', width: 20 },
                    { header: 'Cliente', key: 'cliente', width: 28 },
                    { header: `Monto (${moneda})`, key: 'monto', width: 18 },
                    { header: 'Préstamo #', key: 'prestamo', width: 12 },
                    { header: 'Observaciones', key: 'obs', width: 30 },
                ];
                applyHeaderStyle(ws.getRow(1));
                datos.forEach(d => {
                    const row = ws.addRow({ id: d.id, fecha: new Date(d.fecha_pago).toLocaleString('es-ES'), cliente: `${d.nombre} ${d.apellido}`, monto: parseFloat(d.monto_pagado), prestamo: d.prestamo_id, obs: d.observaciones || '' });
                    row.getCell('monto').numFmt = MONEDA_FMT;
                });
                if (datos.length > 0) {
                    const tot = datos.reduce((s, d) => s + parseFloat(d.monto_pagado), 0);
                    const tr = ws.addRow({ id: '', fecha: '', cliente: `TOTAL (${datos.length} cobros)`, monto: tot });
                    tr.getCell('monto').numFmt = MONEDA_FMT; applyTotalStyle(tr);
                }

            /* ---- EGRESOS ---- */
            } else if (tipo_reporte === 'gastos') {
                const datos = ReporteAvanzadoModel.gastosPorFecha(fecha_inicio, fecha_fin);
                const ws    = workbook.addWorksheet('Gastos');
                ws.columns = [
                    { header: 'Fecha', key: 'fecha', width: 14 },
                    { header: 'Descripción', key: 'desc', width: 30 },
                    { header: 'Categoría', key: 'cat', width: 16 },
                    { header: `Monto (${moneda})`, key: 'monto', width: 18 },
                    { header: 'Registrado por', key: 'reg', width: 20 },
                    { header: 'Observación', key: 'obs', width: 28 },
                ];
                applyHeaderStyle(ws.getRow(1));
                datos.forEach(d => {
                    const row = ws.addRow({ fecha: new Date(d.fecha_gasto).toLocaleDateString('es-ES'), desc: d.descripcion, cat: d.categoria, monto: parseFloat(d.monto), reg: d.registrado_por || '', obs: d.observacion || '' });
                    row.getCell('monto').numFmt = MONEDA_FMT;
                });
                if (datos.length > 0) {
                    const tot = datos.reduce((s, d) => s + parseFloat(d.monto), 0);
                    const tr = ws.addRow({ fecha: '', desc: `TOTAL (${datos.length} gastos)`, cat: '', monto: tot });
                    tr.getCell('monto').numFmt = MONEDA_FMT; applyTotalStyle(tr);
                }

            /* ---- CARTERA VENCIDA ---- */
            } else if (tipo_reporte === 'cartera_vencida') {
                const datos = ReporteAvanzadoModel.carteraVencida();
                const ws    = workbook.addWorksheet('Cartera Vencida');
                ws.columns = [
                    { header: 'Préstamo #', key: 'id', width: 12 },
                    { header: 'Cliente', key: 'cliente', width: 28 },
                    { header: 'DNI', key: 'dni', width: 14 },
                    { header: 'Teléfono', key: 'tel', width: 14 },
                    { header: `Capital (${moneda})`, key: 'capital', width: 16 },
                    { header: `Total c/Int (${moneda})`, key: 'total', width: 16 },
                    { header: `Total Pagado (${moneda})`, key: 'pagado', width: 16 },
                    { header: `Saldo Pendiente (${moneda})`, key: 'saldo', width: 18 },
                    { header: 'Días Mora', key: 'dias', width: 12 },
                    { header: 'Fecha Venc.', key: 'venc', width: 14 },
                ];
                applyHeaderStyle(ws.getRow(1));
                datos.forEach(d => {
                    const row = ws.addRow({ id: d.id, cliente: `${d.nombre} ${d.apellido}`, dni: d.dni, tel: d.telefono || '', capital: parseFloat(d.monto_prestado), total: parseFloat(d.monto_total), pagado: parseFloat(d.total_pagado), saldo: parseFloat(d.saldo_pendiente), dias: d.dias_mora, venc: d.fecha_fin });
                    ['capital','total','pagado','saldo'].forEach(k => row.getCell(k).numFmt = MONEDA_FMT);
                    row.getCell('dias').font  = { bold: true, color: { argb: 'FFEF4444' } };
                    row.getCell('saldo').font = { bold: true, color: { argb: 'FFEF4444' } };
                });
                if (datos.length > 0) {
                    const totSaldo = datos.reduce((s, d) => s + parseFloat(d.saldo_pendiente), 0);
                    const tr = ws.addRow({ id: '', cliente: `TOTAL (${datos.length} vencidos)`, saldo: totSaldo });
                    tr.getCell('saldo').numFmt = MONEDA_FMT; applyTotalStyle(tr);
                }

            /* ---- EMPEÑOS ---- */
            } else if (tipo_reporte === 'empenos') {
                const datos = ReporteAvanzadoModel.empenosPorFecha(fecha_inicio, fecha_fin);
                const ws    = workbook.addWorksheet('Empeños');
                ws.columns = [
                    { header: 'ID', key: 'id', width: 8 },
                    { header: 'Artículo', key: 'articulo', width: 24 },
                    { header: 'Descripción', key: 'desc', width: 28 },
                    { header: 'Cliente', key: 'cliente', width: 24 },
                    { header: 'DNI', key: 'dni', width: 13 },
                    { header: 'Teléfono', key: 'tel', width: 13 },
                    { header: `Tasación (${moneda})`, key: 'tasacion', width: 16 },
                    { header: `Prestado (${moneda})`, key: 'prestado', width: 16 },
                    { header: 'Fecha Límite', key: 'limite', width: 14 },
                    { header: 'Estado', key: 'estado', width: 14 },
                ];
                applyHeaderStyle(ws.getRow(1));
                datos.forEach(d => {
                    const row = ws.addRow({ id: d.id, articulo: d.nombre_articulo, desc: d.descripcion || '', cliente: `${d.nombre} ${d.apellido}`, dni: d.dni, tel: d.telefono || '', tasacion: parseFloat(d.valor_tasacion), prestado: parseFloat(d.monto_prestado), limite: d.fecha_limite, estado: d.estado.toUpperCase() });
                    row.getCell('tasacion').numFmt = MONEDA_FMT; row.getCell('prestado').numFmt = MONEDA_FMT;
                    const color = estadoColor[d.estado];
                    if (color) row.getCell('estado').font = { bold: true, color: { argb: color } };
                });
                if (datos.length > 0) {
                    const totTas = datos.reduce((s, d) => s + parseFloat(d.valor_tasacion), 0);
                    const tr = ws.addRow({ id: '', articulo: `TOTAL (${datos.length} empeños)`, tasacion: totTas });
                    tr.getCell('tasacion').numFmt = MONEDA_FMT; applyTotalStyle(tr);
                }

            /* ---- AHORROS ---- */
            } else if (tipo_reporte === 'ahorros') {
                const datos = ReporteAvanzadoModel.ahorrosPorFecha(fecha_inicio, fecha_fin);
                const ws    = workbook.addWorksheet('Ahorros');
                ws.columns = [
                    { header: 'ID Mov.', key: 'id', width: 10 },
                    { header: 'Fecha', key: 'fecha', width: 20 },
                    { header: 'Cliente', key: 'cliente', width: 26 },
                    { header: 'DNI', key: 'dni', width: 13 },
                    { header: 'Cuenta #', key: 'cuenta', width: 11 },
                    { header: 'Tipo', key: 'tipo', width: 12 },
                    { header: `Monto (${moneda})`, key: 'monto', width: 16 },
                    { header: 'Observación', key: 'obs', width: 28 },
                ];
                applyHeaderStyle(ws.getRow(1));
                datos.forEach(d => {
                    const row = ws.addRow({ id: d.id, fecha: new Date(d.fecha_movimiento).toLocaleString('es-ES'), cliente: `${d.nombre} ${d.apellido}`, dni: d.dni, cuenta: d.cuenta_id, tipo: d.tipo_movimiento.toUpperCase(), monto: parseFloat(d.monto), obs: d.observacion || '' });
                    row.getCell('monto').numFmt = MONEDA_FMT;
                    row.getCell('tipo').font = { bold: true, color: { argb: d.tipo_movimiento === 'deposito' ? 'FF10B981' : 'FFEF4444' } };
                });
                if (datos.length > 0) {
                    const dep = datos.filter(d => d.tipo_movimiento === 'deposito').reduce((s, d) => s + parseFloat(d.monto), 0);
                    const ret = datos.filter(d => d.tipo_movimiento === 'retiro').reduce((s, d) => s + parseFloat(d.monto), 0);
                    const tr1 = ws.addRow({ id: '', fecha: '', cliente: 'TOTAL DEPÓSITOS', monto: dep });
                    tr1.getCell('monto').numFmt = MONEDA_FMT; applyTotalStyle(tr1);
                    const tr2 = ws.addRow({ id: '', fecha: '', cliente: 'TOTAL RETIROS', monto: ret });
                    tr2.getCell('monto').numFmt = MONEDA_FMT; applyTotalStyle(tr2);
                }

            /* ---- RENTABILIDAD ---- */
            } else if (tipo_reporte === 'rentabilidad') {
                const d = ReporteAvanzadoModel.rentabilidadPorFecha(fecha_inicio, fecha_fin);

                // Hoja 1: Resumen P&L
                const wsRes = workbook.addWorksheet('Resumen P&L');
                wsRes.columns = [{ header: 'Concepto', key: 'concepto', width: 34 }, { header: `Valor (${moneda})`, key: 'valor', width: 20 }];
                applyHeaderStyle(wsRes.getRow(1));
                const plData = [
                    ['INGRESOS', null],
                    [`Cobros recibidos (${d.cantidadCobros} pagos)`, d.totalCobrado],
                    ['', null],
                    ['EGRESOS', null],
                    [`Gastos operativos (${d.cantidadGastos} gastos)`, d.totalGastos],
                    ['', null],
                    ['RESULTADO', null],
                    ['Utilidad / Pérdida Neta', d.utilidadNeta],
                    ['', null],
                    ['ACTIVIDAD CREDITICIA', null],
                    [`Préstamos otorgados (${d.prestamosOtorgados})`, d.capitalDesembolsado],
                    ['Intereses esperados del período', d.interesesEsperados],
                ];
                plData.forEach(([concepto, valor]) => {
                    const row = wsRes.addRow({ concepto, valor: valor !== null ? valor : '' });
                    if (valor !== null) row.getCell('valor').numFmt = MONEDA_FMT;
                    if (concepto === 'Utilidad / Pérdida Neta') {
                        row.font = { bold: true, size: 12, color: { argb: d.utilidadNeta >= 0 ? 'FF10B981' : 'FFEF4444' } };
                    }
                    if (['INGRESOS','EGRESOS','RESULTADO','ACTIVIDAD CREDITICIA'].includes(concepto)) {
                        row.font = { bold: true }; row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
                    }
                });

                // Hoja 2: Detalle cobros
                const wsPag = workbook.addWorksheet('Cobros del Período');
                wsPag.columns = [
                    { header: 'ID Pago', key: 'id', width: 10 }, { header: 'Fecha', key: 'fecha', width: 20 },
                    { header: 'Cliente', key: 'cliente', width: 26 }, { header: `Monto (${moneda})`, key: 'monto', width: 16 }
                ];
                applyHeaderStyle(wsPag.getRow(1));
                d.pagosDetalle.forEach(p => {
                    const row = wsPag.addRow({ id: p.id, fecha: new Date(p.fecha_pago).toLocaleString('es-ES'), cliente: `${p.nombre} ${p.apellido}`, monto: parseFloat(p.monto_pagado) });
                    row.getCell('monto').numFmt = MONEDA_FMT;
                });
                if (d.pagosDetalle.length > 0) {
                    const tr = wsPag.addRow({ id: '', fecha: '', cliente: 'TOTAL', monto: d.totalCobrado });
                    tr.getCell('monto').numFmt = MONEDA_FMT; applyTotalStyle(tr);
                }

                // Hoja 3: Detalle gastos
                const wsGas = workbook.addWorksheet('Gastos del Período');
                wsGas.columns = [
                    { header: 'Fecha', key: 'fecha', width: 14 }, { header: 'Descripción', key: 'desc', width: 30 },
                    { header: 'Categoría', key: 'cat', width: 16 }, { header: `Monto (${moneda})`, key: 'monto', width: 16 }, { header: 'Registrado por', key: 'reg', width: 20 }
                ];
                applyHeaderStyle(wsGas.getRow(1));
                d.gastosDetalle.forEach(g => {
                    const row = wsGas.addRow({ fecha: new Date(g.fecha_gasto).toLocaleDateString('es-ES'), desc: g.descripcion, cat: g.categoria, monto: parseFloat(g.monto), reg: g.registrado_por || '' });
                    row.getCell('monto').numFmt = MONEDA_FMT;
                });
                if (d.gastosDetalle.length > 0) {
                    const tr = wsGas.addRow({ fecha: '', desc: 'TOTAL', cat: '', monto: d.totalGastos });
                    tr.getCell('monto').numFmt = MONEDA_FMT; applyTotalStyle(tr);
                }
            }

            const fileName = `Reporte_${tipo_reporte}_${Date.now()}.xlsx`;
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
            await workbook.xlsx.write(res);
            res.end();
        } catch (error) {
            console.error('Error generando Excel:', error);
            req.flash('mensajeError', 'Ocurrió un error al generar el reporte');
            res.redirect('/reportes/panel');
        }
    },

    /* ── 9. PDF CARTERA VENCIDA ──────────────────────────────────── */
    descargarCarteraVencidaPDF: (req, res) => {
        try {
            const datos  = ReporteAvanzadoModel.carteraVencida();
            const config = getConfig();
            const moneda = config.moneda;

            const doc = new PDFDocument({ margin: 40, size: 'A4' });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=Cartera_Vencida_${Date.now()}.pdf`);
            doc.pipe(res);

            // Header
            doc.rect(0, 0, doc.page.width, 80).fill('#0f172a');
            if (config.logo) try { doc.image(`public/uploads/${config.logo}`, 40, 16, { width: 48 }); } catch(e){}
            doc.fillColor('#ffffff').fontSize(18).font('Times-Bold').text('REPORTE DE CARTERA VENCIDA', 100, 22);
            doc.fontSize(9).font('Times-Roman')
               .text(config.nombre_empresa.toUpperCase(), 100, 46)
               .text(`Generado: ${new Date().toLocaleString('es-ES')}  ·  Total registros: ${datos.length}`, 100, 58);
            doc.fillColor('#000000');

            // Columnas: N° | Cliente | DNI | Teléfono | Capital | Saldo Pend. | Días Mora
            const cols = [40, 65, 200, 255, 310, 375, 445, 510];
            const drawHeader = (y) => {
                doc.rect(40, y, doc.page.width - 80, 20).fillAndStroke('#ef4444', '#dc2626');
                doc.fillColor('#ffffff').font('Times-Bold').fontSize(8);
                ['N°','Cliente','DNI','Teléfono','Capital','Saldo Pend.','Días Mora'].forEach((h, i) => {
                    doc.text(h, cols[i], y + 6, { width: cols[i+1] - cols[i] - 4, align: i === 1 ? 'left' : 'center' });
                });
            };

            let y = 100;
            drawHeader(y); y += 20;
            doc.font('Times-Roman').fontSize(8);

            datos.forEach((d, idx) => {
                if (y > 760) { doc.addPage(); y = 50; drawHeader(y); y += 20; doc.font('Times-Roman').fontSize(8); }
                if (idx % 2 === 0) doc.rect(40, y, doc.page.width - 80, 18).fill('#fff5f5');
                else               doc.rect(40, y, doc.page.width - 80, 18).fill('#ffffff');
                doc.moveTo(40, y + 18).lineTo(doc.page.width - 40, y + 18).strokeColor('#fecaca').stroke();

                const ry = y + 5;
                doc.fillColor('#334155').text(String(idx + 1), cols[0], ry, { width: 20, align: 'center' });
                doc.fillColor('#111827').text(`${d.nombre} ${d.apellido}`, cols[1], ry, { width: 50 });
                doc.fillColor('#334155').text(d.dni || '-', cols[2], ry, { width: 50, align: 'center' });
                doc.text(d.telefono || '-', cols[3], ry, { width: 50, align: 'center' });
                doc.text(`${moneda} ${parseFloat(d.monto_prestado).toFixed(2)}`, cols[4], ry, { width: 60, align: 'right' });
                doc.fillColor('#dc2626').font('Times-Bold').text(`${moneda} ${parseFloat(d.saldo_pendiente).toFixed(2)}`, cols[5], ry, { width: 65, align: 'right' });
                doc.fillColor('#ea580c').text(`${d.dias_mora} días`, cols[6], ry, { width: 60, align: 'center' });
                doc.font('Times-Roman').fillColor('#334155');
                y += 18;
            });

            // Totals row
            y += 6;
            if (y > 760) { doc.addPage(); y = 50; }
            const totSaldo = datos.reduce((s, d) => s + parseFloat(d.saldo_pendiente || 0), 0);
            doc.rect(40, y, doc.page.width - 80, 22).fillAndStroke('#fef2f2', '#fecaca');
            doc.fillColor('#dc2626').font('Times-Bold').fontSize(9)
               .text(`TOTAL SALDO PENDIENTE: ${moneda} ${totSaldo.toFixed(2)}`, 40, y + 7, { align: 'right', width: doc.page.width - 80 });

            doc.end();
        } catch (error) {
            console.error('Error PDF Cartera Vencida:', error);
            res.redirect('/reportes/panel');
        }
    },

    /* ── 10. TICKET AHORRO ───────────────────────────────────────── */
    generarTicketAhorro: (req, res) => {
        const { id } = req.params;
        try {
            const mov    = AhorroModel.obtenerMovimientoPorId(id);
            const config = getConfig();
            if (!mov) return res.redirect('/ahorros');

            const doc = new PDFDocument({ size: [226, 400], margin: 10 });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename=Voucher_${id}.pdf`);
            doc.pipe(res);

            if (config.logo) { try { doc.image(`public/uploads/${config.logo}`, 90, 10, { width: 40 }); doc.moveDown(4); } catch(e) { doc.moveDown(2); } }
            else { doc.moveDown(2); }

            doc.fontSize(10).font('Times-Bold').text(config.nombre_empresa.toUpperCase(), { align: 'center' });
            doc.fontSize(8).font('Times-Roman').text(`RUC: ${config.ruc || '---'}`, { align: 'center' });
            doc.text('--------------------------------', { align: 'center' });
            doc.moveDown(0.5);
            doc.font('Times-Bold').text('COMPROBANTE AHORRO', { align: 'center' });
            doc.text(`OP: ${mov.mov_id}`, { align: 'center' });
            doc.font('Times-Roman').text(new Date(mov.fecha_movimiento).toLocaleString(), { align: 'center' });
            doc.moveDown(0.5);
            doc.text('--------------------------------', { align: 'center' });
            doc.font('Times-Roman').text(`Cliente: ${mov.nombre} ${mov.apellido}`).text(`DNI: ${mov.dni}`).text(`Cuenta: #${mov.cuenta_id}`);
            doc.moveDown(1);
            doc.font('Times-Bold').fontSize(14).text(mov.tipo_movimiento.toUpperCase(), { align: 'center' });
            doc.fontSize(16).text(`${config.moneda} ${parseFloat(mov.monto).toFixed(2)}`, { align: 'center' });
            doc.fontSize(8).font('Times-Roman');
            if (mov.observacion) { doc.moveDown(0.5); doc.text(`Obs: ${mov.observacion}`, { align: 'center' }); }
            doc.moveDown(2);
            doc.text('Verifique su dinero antes de retirarse.', { align: 'center' });
            doc.end();
        } catch (error) {
            console.error('Error Ticket Ahorro:', error);
            res.redirect('/ahorros');
        }
    }
};

module.exports = reportesController;
