const finance = require('../utils/finance');

const simuladorController = {

    // 1. Mostrar la pantalla del simulador
    mostrar: (req, res) => {
        res.render('simulador/index', { 
            title: 'Calculadora de Préstamos',
            resultado: null, // Al inicio no hay resultados
            datos: {} // Para mantener los datos en el formulario
        });
    },

    // 2. Procesar el cálculo
    calcular: (req, res) => {
        const { monto, interes, cuotas, frecuencia, sistema_pago } = req.body;

        // Validar datos básicos
        if (!monto || !interes || !cuotas) {
            req.flash('mensajeError', 'Complete todos los campos para calcular');
            return res.redirect('/simulador');
        }

        const montoPrestado = parseFloat(monto);
        const tasa = parseFloat(interes);
        const numCuotas = parseInt(cuotas);
        const sistema = sistema_pago || 'frances';

        // Generar Cronograma y Totales con la nueva función (Proyectado desde hoy)
        const plan = finance.calcularPlan(
            montoPrestado, 
            tasa, 
            numCuotas, 
            frecuencia, 
            new Date(), // Usamos fecha de hoy para la simulación
            sistema
        );

        plan.cliente_nombre = req.body.cliente_nombre || '';

        res.render('simulador/index', {
            title: 'Calculadora de Préstamos',
            resultado: plan,
            datos: req.body // Devolvemos lo que escribió el usuario para que no se borre
        });
    }
};

module.exports = simuladorController;