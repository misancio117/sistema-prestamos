const DashboardModel = require('../models/DashboardModel');

const dashboardController = {
    
    mostrarDashboard: (req, res) => {
        try {
            const totales = DashboardModel.obtenerTotales();
            const datosGrafico = DashboardModel.obtenerDatosGraficos();

            let estados = { pendiente: 0, pagado: 0, vencido: 0, finalizado: 0 };
            datosGrafico.forEach(d => {
                if (estados[d.estado] !== undefined) {
                    estados[d.estado] = d.cantidad;
                }
            });

            res.render('index', { 
                title: 'Panel de Control',
                pagina: 'dashboard',
                totales: totales,
                graficos: {
                    estados: [estados.pendiente, estados.pagado, estados.vencido, estados.finalizado],
                    balance: [totales.capital_prestado, totales.ganancias]
                }
            });

        } catch (error) {
            console.error(error);
            res.render('index', { 
                title: 'Panel de Control',
                pagina: 'dashboard',
                totales: { 
                    clientes_con_deuda: 0, 
                    capital_disponible: 0, 
                    capital_prestado: 0, 
                    ganancias: 0
                },
                graficos: { estados: [0,0,0,0], balance: [0,0] }
            });
        }
    }
};

module.exports = dashboardController;