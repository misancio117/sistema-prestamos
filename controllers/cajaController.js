const CajaModel = require('../models/CajaModel');
const ConfigModel = require('../models/ConfigModel');
const PDFDocument = require('pdfkit');

const cajaController = {

    // 1. Mostrar Reporte en Pantalla
    mostrarReporte: (req, res) => {
        try {
            const fechaConsulta = req.query.fecha || new Date().toISOString().split('T')[0];

            const cobrosPrestamos = CajaModel.totalPagos(fechaConsulta);
            const salidasPrestamos = CajaModel.totalPrestamosEntregados(fechaConsulta);
            const gastosOperativos = CajaModel.totalGastos(fechaConsulta);
            const depositosAhorro = CajaModel.totalAhorros(fechaConsulta, 'deposito');
            const retirosAhorro = CajaModel.totalAhorros(fechaConsulta, 'retiro');
            const config = ConfigModel.obtener();

            const totalIngresos = parseFloat(cobrosPrestamos) + parseFloat(depositosAhorro);
            const totalEgresos = parseFloat(salidasPrestamos) + parseFloat(gastosOperativos) + parseFloat(retirosAhorro);
            const balanceDia = totalIngresos - totalEgresos;

            const empresaConfig = config || { moneda: '$', nombre_empresa: 'Sistema' };

            res.render('caja/index', { 
                title: 'Corte de Caja Diario',
                fecha: fechaConsulta,
                empresa: empresaConfig,
                datos: {
                    cobrosPrestamos, depositosAhorro, salidasPrestamos, 
                    retirosAhorro, gastosOperativos, totalIngresos, totalEgresos, balanceDia
                }
            });

        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al calcular el corte de caja');
            res.redirect('/');
        }
    },

    // 2. Imprimir Ticket PDF
    imprimirCierre: (req, res) => {
        try {
            const fechaConsulta = req.query.fecha || new Date().toISOString().split('T')[0];
            let config = ConfigModel.obtener();
            if (!config) config = { nombre_empresa: 'Sistema', moneda: '$', logo: null };
            const moneda = config.moneda;

            const cobrosPrestamos = CajaModel.totalPagos(fechaConsulta);
            const salidasPrestamos = CajaModel.totalPrestamosEntregados(fechaConsulta);
            const gastosOperativos = CajaModel.totalGastos(fechaConsulta);
            const depositosAhorro = CajaModel.totalAhorros(fechaConsulta, 'deposito');
            const retirosAhorro = CajaModel.totalAhorros(fechaConsulta, 'retiro');

            const totalIngresos = parseFloat(cobrosPrestamos) + parseFloat(depositosAhorro);
            const totalEgresos = parseFloat(salidasPrestamos) + parseFloat(gastosOperativos) + parseFloat(retirosAhorro);
            const balanceDia = totalIngresos - totalEgresos;

            const doc = new PDFDocument({ size: [226, 600], margin: 10 });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename=Cierre_${fechaConsulta}.pdf`);
            doc.pipe(res);

            if (config.logo) {
                try { doc.image(`public/uploads/${config.logo}`, 90, 10, { width: 40 }); doc.moveDown(4); } 
                catch(e) { doc.moveDown(2); }
            } else { doc.moveDown(2); }

            doc.fontSize(10).font('Helvetica-Bold').text('CIERRE DE CAJA', { align: 'center' });
            doc.fontSize(8).font('Helvetica').text(config.nombre_empresa, { align: 'center' });
            doc.text(`Fecha: ${new Date(fechaConsulta).toLocaleDateString()}`, { align: 'center' });
            doc.text(`Generado: ${new Date().toLocaleTimeString()}`, { align: 'center' });
            doc.text('--------------------------------', { align: 'center' });
            doc.moveDown(0.5);

            doc.fontSize(12).font('Helvetica-Bold').text('BALANCE NETO', { align: 'center' });
            doc.fontSize(16).text(`${moneda} ${balanceDia.toFixed(2)}`, { align: 'center' });
            
            doc.moveDown(1);
            doc.fontSize(10).text('--------------------------------', { align: 'center' });

            doc.font('Helvetica-Bold').text('INGRESOS (+)', { align: 'left' });
            doc.font('Helvetica');
            doc.text(`Cobros Préstamos:   ${parseFloat(cobrosPrestamos).toFixed(2)}`);
            doc.text(`Depósitos Ahorro:   ${parseFloat(depositosAhorro).toFixed(2)}`);
            doc.font('Helvetica-Bold').text(`TOTAL INGRESOS:     ${totalIngresos.toFixed(2)}`);
            
            doc.moveDown(1);

            doc.font('Helvetica-Bold').text('EGRESOS (-)', { align: 'left' });
            doc.font('Helvetica');
            doc.text(`Préstamos Entregados: ${parseFloat(salidasPrestamos).toFixed(2)}`);
            doc.text(`Retiros Ahorro:       ${parseFloat(retirosAhorro).toFixed(2)}`);
            doc.text(`Gastos Operativos:    ${parseFloat(gastosOperativos).toFixed(2)}`);
            doc.font('Helvetica-Bold').text(`TOTAL EGRESOS:        ${totalEgresos.toFixed(2)}`);

            doc.moveDown(2);
            doc.text('_'.repeat(30), { align: 'center' });
            doc.text('Firma Responsable', { align: 'center' });

            doc.end();

        } catch (error) {
            console.error("Error PDF Cierre:", error);
            res.redirect('/caja');
        }
    }
};

module.exports = cajaController;