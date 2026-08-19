-- --------------------------------------------------------
-- SQLite Database Schema - Sistema de Préstamos MISACORP
-- Instalación limpia: solo estructura + usuario administrador inicial
-- --------------------------------------------------------

PRAGMA foreign_keys = OFF;

-- Tabla usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre_completo TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  rol TEXT DEFAULT 'empleado',
  estado INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla clientes
CREATE TABLE IF NOT EXISTS clientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dni TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  telefono TEXT DEFAULT NULL,
  direccion TEXT DEFAULT NULL,
  email TEXT DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  foto TEXT DEFAULT NULL
);

-- Tabla configuracion
CREATE TABLE IF NOT EXISTS configuracion (
  id INTEGER PRIMARY KEY,
  nombre_empresa TEXT DEFAULT 'Mi Financiera',
  ruc TEXT DEFAULT '00000000000',
  direccion TEXT DEFAULT 'Dirección Principal',
  telefono TEXT DEFAULT '555-0000',
  email_contacto TEXT DEFAULT 'contacto@empresa.com',
  logo TEXT DEFAULT NULL,
  moneda TEXT DEFAULT '$'
);

-- Tabla boveda
CREATE TABLE IF NOT EXISTS boveda (
  id INTEGER PRIMARY KEY DEFAULT 1,
  saldo_actual REAL NOT NULL DEFAULT 0.00,
  capital_invertido REAL NOT NULL DEFAULT 0.00
);

-- Tabla bitacora
CREATE TABLE IF NOT EXISTS bitacora (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER DEFAULT NULL,
  usuario TEXT DEFAULT 'Sistema',
  accion TEXT DEFAULT NULL,
  detalle TEXT,
  ip TEXT DEFAULT NULL,
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE SET NULL
);

-- Tabla prestamos
CREATE TABLE IF NOT EXISTS prestamos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL,
  monto_prestado REAL NOT NULL,
  tasa_interes REAL NOT NULL,
  monto_total REAL NOT NULL,
  cuotas INTEGER NOT NULL,
  frecuencia TEXT NOT NULL,
  estado TEXT DEFAULT 'pendiente',
  fecha_inicio TEXT NOT NULL,
  fecha_fin TEXT NOT NULL,
  sistema_pago TEXT DEFAULT 'frances',
  motivo_finalizacion TEXT DEFAULT NULL,
  fecha_primer_cobro TEXT DEFAULT NULL,
  FOREIGN KEY (cliente_id) REFERENCES clientes (id) ON DELETE RESTRICT
);

-- Tabla empenos
CREATE TABLE IF NOT EXISTS empenos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL,
  nombre_articulo TEXT NOT NULL,
  descripcion TEXT,
  valor_tasacion REAL NOT NULL,
  monto_prestado REAL NOT NULL,
  fecha_limite TEXT NOT NULL,
  estado TEXT DEFAULT 'en_custodia',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  imagen TEXT DEFAULT NULL,
  prestamo_id INTEGER DEFAULT NULL,
  FOREIGN KEY (cliente_id) REFERENCES clientes (id) ON DELETE RESTRICT,
  FOREIGN KEY (prestamo_id) REFERENCES prestamos (id) ON DELETE SET NULL
);

-- Tabla gastos
CREATE TABLE IF NOT EXISTS gastos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  descripcion TEXT NOT NULL,
  monto REAL NOT NULL,
  categoria TEXT NOT NULL,
  fecha_gasto TEXT NOT NULL,
  usuario_id INTEGER DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  registrado_por TEXT DEFAULT 'Sistema',
  observacion TEXT,
  FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE SET NULL
);

-- Tabla pagos
CREATE TABLE IF NOT EXISTS pagos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  prestamo_id INTEGER NOT NULL,
  monto_pagado REAL NOT NULL,
  fecha_pago DATETIME DEFAULT CURRENT_TIMESTAMP,
  observaciones TEXT,
  FOREIGN KEY (prestamo_id) REFERENCES prestamos (id) ON DELETE CASCADE
);

-- Tabla cuentas_ahorro
CREATE TABLE IF NOT EXISTS cuentas_ahorro (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL UNIQUE,
  saldo_actual REAL DEFAULT 0.00,
  fecha_apertura DATETIME DEFAULT CURRENT_TIMESTAMP,
  tasa_interes REAL DEFAULT 0.00,
  plazo_meses INTEGER DEFAULT 0,
  FOREIGN KEY (cliente_id) REFERENCES clientes (id) ON DELETE CASCADE
);

-- Tabla movimientos_ahorro
CREATE TABLE IF NOT EXISTS movimientos_ahorro (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cuenta_id INTEGER NOT NULL,
  tipo_movimiento TEXT NOT NULL,
  monto REAL NOT NULL,
  fecha_movimiento DATETIME DEFAULT CURRENT_TIMESTAMP,
  observacion TEXT,
  FOREIGN KEY (cuenta_id) REFERENCES cuentas_ahorro (id) ON DELETE CASCADE
);

-- --------------------------------------------------------
-- Datos iniciales obligatorios
-- --------------------------------------------------------

-- Administrador principal (email: admin@sistema.com / contraseña: admin123)
INSERT OR IGNORE INTO usuarios (nombre_completo, email, password, rol, estado)
VALUES ('Administrador', 'admin@sistema.com', '$2b$10$ckrA7Vtx8DI7I9DgNz1N8edDUnz5JEiiRtKFq5QTv6kEJ770SkuC6', 'admin', 1);

-- Configuración inicial de la empresa
INSERT OR IGNORE INTO configuracion (id, nombre_empresa, ruc, direccion, telefono, email_contacto, logo, moneda)
VALUES (1, 'Mi Financiera', '00000000000', 'Dirección Principal', '555-0000', 'contacto@empresa.com', NULL, 'S/');

-- Bóveda con saldo en cero
INSERT OR IGNORE INTO boveda (id, saldo_actual, capital_invertido)
VALUES (1, 0.00, 0.00);

PRAGMA foreign_keys = ON;
