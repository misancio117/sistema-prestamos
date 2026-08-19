# 💎 Servicios Vedia - Sistema de Gestión de Préstamos

![Versión](https://img.shields.io/badge/versi%C3%B3n-1.0.0-blue.svg)
![Estado](https://img.shields.io/badge/estado-estable-brightgreen.svg)
![Tecnología](https://img.shields.io/badge/stack-Node.js%20%7C%20Express%20%7C%20MySQL-orange.svg)

**Servicios Vedia** es un sistema integral de gestión financiera diseñado para entidades de préstamos con garantía (empeños) e intereses. Ofrece una plataforma robusta para administrar clientes, controlar el flujo de caja, gestionar ahorros y generar reportes profesionales.

---

## 🚀 Características Principales

### 🏦 Gestión de Préstamos
- Registro de préstamos con frecuencias personalizadas (diario, semanal, mensual).
- Cálculo automático de intereses y cuotas.
- Seguimiento de estados: Pendiente, Pagado, Vencido.
- **Simulador de Préstamos:** Herramienta interactiva para proyectar pagos e intereses.

### 💎 Módulo de Empeños (Garantías)
- Registro de artículos en garantía con tasación y montos prestados.
- Control de estados del artículo: En custodia, Retirado, Perdido o Vendido.
- Opción de adjuntar fotografías de las prendas.

### 💰 Cuentas de Ahorro
- Apertura de cuentas para clientes con seguimiento de saldos.
- Registro de depósitos, retiros e intereses ganados.

### 📊 Control Financiero
- **Caja y Bóveda:** Gestión de ingresos y egresos diarios.
- **Gastos:** Registro detallado de egresos operativos para control de rentabilidad.
- **Bitácora (Audit Trail):** Registro de todas las acciones realizadas por los usuarios para máxima seguridad.

### 📑 Reportes y Exportación
- Generación de contratos y recibos en **PDF**.
- Exportación de listados de préstamos y clientes a **Excel**.
- Dashboard interactivo con gráficos de rendimiento.

---

## 🛠️ Tecnologías Utilizadas

- **Backend:** Node.js, Express.js
- **Motor de Plantillas:** EJS (Embedded JavaScript)
- **Base de Datos:** MySQL 8+
- **Estilos:** CSS3, Bootstrap 5
- **Generación de Documentos:** PDFKit, ExcelJS

---

## 📦 Instalación y Configuración

Siga estos pasos para configurar el sistema en su entorno local:

### 1. Requisitos Previos
- [Node.js](https://nodejs.org/) (Versión 16 o superior)
- [Laragon](https://laragon.org/) o XAMPP con MySQL 8.0+

### 2. Clonar el Proyecto
```bash
git clone <url-del-repositorio>
cd sistema-prestamos
```

### 3. Instalar Dependencias
```bash
npm install
```

### 4. Configurar la Base de Datos
1. Inicie Laragon/MySQL.
2. Cree una base de datos llamada `sistema_prestamos`.
3. Importe el archivo de esquema ubicado en: `database/schema.sql`.

### 5. Variables de Entorno
Cree un archivo `.env` en la raíz del proyecto y configure sus credenciales:
```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=sistema_prestamos
DB_PORT=3306
SESSION_SECRET=tu_secreto_super_seguro
```

### 6. Iniciar el Sistema
```bash
# Modo desarrollo
npm run dev

# Modo producción
node app.js
```
Acceda a: `http://localhost:3000`

---

## 📂 Estructura del Proyecto

```text
├── config/             # Configuración de base de datos
├── controllers/        # Lógica de negocio por módulo
├── database/           # Respaldo y esquema SQL
├── middleware/         # Autenticación y seguridad
├── models/             # Modelos de datos (Consultas SQL)
├── public/             # Archivos estáticos (CSS, JS, Imágenes)
│   └── uploads/        # Fotos de clientes y empeños
├── routes/             # Definición de puntos de acceso (endpoints)
├── views/              # Plantillas EJS de la interfaz
├── .env                # Variables de entorno (Sensible)
├── app.js              # Punto de entrada de la aplicación
└── package.json        # Dependencias y scripts
```

---

## 🛡️ Seguridad
- Contraseñas encriptadas con **BcryptJS**.
- Manejo de sesiones seguras mediante Middleware.
- Protección de rutas privadas.
- Bitácora de actividades para auditoría interna.

---

## 👤 Créditos y Soporte
Desarrollado para **Servicios Vedia**.  
Para consultas técnicas o soporte, contacte con el administrador del sistema.

---
© 2026 Servicios Vedia. Todos los derechos reservados.
