const { Decimal } = require('decimal.js');
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

const finance = {
    
    // Parse YYYY-MM-DD string to Date object in local timezone
    parseLocalDate: (dateStr) => {
        if (!dateStr) return null;
        if (dateStr instanceof Date) return dateStr;
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);
            return new Date(year, month, day);
        }
        return new Date(dateStr);
    },

    // Format Date object to YYYY-MM-DD in local timezone
    formatLocalDate: (date) => {
        if (!date) return '';
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    // Función para sumar días o meses a una fecha
    sumarFecha: (fecha, frecuencia) => {
        const nuevaFecha = new Date(fecha);
        if (frecuencia === 'diario') {
            nuevaFecha.setDate(nuevaFecha.getDate() + 1);
        } else if (frecuencia === 'semanal') {
            nuevaFecha.setDate(nuevaFecha.getDate() + 7);
        } else if (frecuencia === 'quincenal') {
            nuevaFecha.setDate(nuevaFecha.getDate() + 15);
        } else if (frecuencia === 'mensual') {
            nuevaFecha.setMonth(nuevaFecha.getMonth() + 1);
        }
        return nuevaFecha;
    },

    // Generar datos financieros del préstamo
    calcularPlan: (montoPrestado, tasa, cuotas, frecuencia, fechaInicio, sistema, fechaPrimerCobro) => {
        const listaCuotas = [];
        let fechaActual;
        if (fechaPrimerCobro) {
            fechaActual = finance.parseLocalDate(fechaPrimerCobro);
        } else {
            fechaActual = finance.parseLocalDate(fechaInicio);
            fechaActual = finance.sumarFecha(fechaActual, frecuencia);
        }

        let montoTotal = 0;
        let montoInteresTotal = 0;

        const dMonto    = new Decimal(montoPrestado);
        const dTasa     = new Decimal(tasa);
        const dCuotas   = new Decimal(cuotas);

        if (sistema === 'aleman') {
            const amortizacionConstante = dMonto.div(dCuotas);
            let saldoRestante = dMonto;

            for (let i = 1; i <= cuotas; i++) {
                const interesCuota = saldoRestante.mul(dTasa.div(100));
                const cuotaTotal   = amortizacionConstante.plus(interesCuota);
                saldoRestante      = saldoRestante.minus(amortizacionConstante);

                listaCuotas.push({
                    numero:        i,
                    fecha:         new Date(fechaActual),
                    monto:         cuotaTotal.toDecimalPlaces(2).toNumber(),
                    amortizacion:  amortizacionConstante.toDecimalPlaces(2).toNumber(),
                    interes:       interesCuota.toDecimalPlaces(2).toNumber(),
                    saldo:         Decimal.max(0, saldoRestante).toDecimalPlaces(2).toNumber()
                });

                montoInteresTotal = new Decimal(montoInteresTotal).plus(interesCuota).toNumber();
                fechaActual = finance.sumarFecha(fechaActual, frecuencia);
            }
            montoTotal = new Decimal(montoPrestado).plus(montoInteresTotal).toNumber();

        } else {
            // Frances: interés directo total (lógica original mantenida, precisión mejorada)
            const dInteresTotal     = dMonto.mul(dTasa.div(100)).mul(dCuotas);
            const dMontoTotal       = dMonto.plus(dInteresTotal);
            const dCuotaFija        = dMontoTotal.div(dCuotas);
            const dAmortizacion     = dMonto.div(dCuotas);
            const dInteresFijo      = dInteresTotal.div(dCuotas);
            let   saldoRestante     = dMonto;

            for (let i = 1; i <= cuotas; i++) {
                saldoRestante = saldoRestante.minus(dAmortizacion);
                listaCuotas.push({
                    numero:       i,
                    fecha:        new Date(fechaActual),
                    monto:        dCuotaFija.toDecimalPlaces(2).toNumber(),
                    amortizacion: dAmortizacion.toDecimalPlaces(2).toNumber(),
                    interes:      dInteresFijo.toDecimalPlaces(2).toNumber(),
                    saldo:        Decimal.max(0, saldoRestante).toDecimalPlaces(2).toNumber()
                });
                fechaActual = finance.sumarFecha(fechaActual, frecuencia);
            }

            montoInteresTotal = dInteresTotal.toNumber();
            montoTotal        = dMontoTotal.toNumber();
        }

        return {
            montoPrestado: parseFloat(montoPrestado),
            tasa:          parseFloat(tasa),
            montoInteres:  new Decimal(montoInteresTotal).toDecimalPlaces(2).toNumber(),
            montoTotal:    new Decimal(montoTotal).toDecimalPlaces(2).toNumber(),
            cronograma:    listaCuotas
        };
    },

    // Bridge de compatibilidad (por si queda alguna llamada residual)
    calcularCronograma: (montoTotal, cuotas, frecuencia, fechaInicio) => {
        const listaCuotas = [];
        const montoCuota = montoTotal / cuotas;
        let fechaActual = new Date(fechaInicio);
        fechaActual = finance.sumarFecha(fechaActual, frecuencia);
        for (let i = 1; i <= cuotas; i++) {
            listaCuotas.push({
                numero: i,
                fecha: new Date(fechaActual),
                monto: montoCuota
            });
            fechaActual = finance.sumarFecha(fechaActual, frecuencia);
        }
        return listaCuotas;
    }
};

module.exports = finance;