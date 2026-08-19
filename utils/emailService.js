const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const emailService = {
    
    enviarCorreo: async (destinatario, asunto, contenidoHTML) => {
        if (!destinatario) return;
        try {
            await transporter.sendMail({
                from: `"Sistema Financiero" <${process.env.EMAIL_USER}>`,
                to: destinatario,
                subject: asunto,
                html: contenidoHTML
            });
            console.log(`Correo enviado a ${destinatario}`);
        } catch (error) {
            console.error('Error enviando correo:', error.message);
        }
    },

    // AHORA RECIBE 'moneda' COMO PARÁMETRO
    plantillaPrestamo: (cliente, monto, cuotas, total, moneda) => {
        return `
            <div style="font-family: Arial; border: 1px solid #ddd; padding: 20px; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #0d6efd; color: white; padding: 15px; text-align: center;">
                    <h2 style="margin:0;">¡Préstamo Aprobado!</h2>
                </div>
                <div style="padding: 20px;">
                    <p>Hola <strong>${cliente}</strong>,</p>
                    <p>Tu solicitud ha sido aprobada exitosamente.</p>
                    <table style="width:100%; border-collapse: collapse;">
                        <tr><td style="padding:8px;">Monto Recibido:</td><td style="font-weight:bold;">${moneda} ${parseFloat(monto).toFixed(2)}</td></tr>
                        <tr><td style="padding:8px;">Total a Pagar:</td><td style="font-weight:bold;">${moneda} ${parseFloat(total).toFixed(2)}</td></tr>
                        <tr><td style="padding:8px;">Cuotas:</td><td>${cuotas}</td></tr>
                    </table>
                </div>
            </div>
        `;
    },

    plantillaPago: (cliente, monto, fecha, saldoPendiente, moneda) => {
        return `
            <div style="font-family: Arial; border: 1px solid #ddd; padding: 20px; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #198754; color: white; padding: 15px; text-align: center;">
                    <h2 style="margin:0;">Pago Recibido</h2>
                </div>
                <div style="padding: 20px; text-align: center;">
                    <p>Hola <strong>${cliente}</strong>,</p>
                    <p>Hemos registrado tu pago correctamente.</p>
                    <div style="background-color: #f0fdf4; padding: 15px; margin: 20px 0; border-radius: 8px;">
                        <span style="font-size: 14px; color: #166534;">Monto Pagado</span><br>
                        <span style="font-size: 28px; font-weight: bold; color: #15803d;">${moneda} ${parseFloat(monto).toFixed(2)}</span>
                        <div style="font-size: 12px; color: #666; margin-top:5px;">${new Date(fecha).toLocaleString()}</div>
                    </div>
                    <p><strong>Saldo Restante:</strong> ${moneda} ${parseFloat(saldoPendiente).toFixed(2)}</p>
                </div>
            </div>
        `;
    },

    plantillaAhorro: (cliente, tipo, monto, nuevoSaldo, moneda) => {
        const color = tipo === 'deposito' ? '#198754' : '#dc3545';
        const titulo = tipo === 'deposito' ? 'Depósito Confirmado' : 'Retiro Realizado';
        
        return `
            <div style="font-family: Arial; border: 1px solid #ddd; max-width: 500px; margin: 0 auto;">
                <div style="background-color: ${color}; color: white; padding: 15px; text-align: center;">
                    <h2 style="margin:0;">${titulo}</h2>
                </div>
                <div style="padding: 20px;">
                    <p>Hola <strong>${cliente}</strong>,</p>
                    <p>Se ha registrado un movimiento en tu cuenta.</p>
                    <div style="text-align: center; margin: 20px 0;">
                        <span style="font-size: 24px; font-weight: bold; color: ${color};">
                            ${tipo === 'deposito' ? '+' : '-'} ${moneda} ${parseFloat(monto).toFixed(2)}
                        </span>
                    </div>
                    <p style="text-align: center; color: #666;">
                        <strong>Saldo Disponible:</strong> ${moneda} ${parseFloat(nuevoSaldo).toFixed(2)}
                    </p>
                </div>
            </div>
        `;
    }
};

module.exports = emailService;