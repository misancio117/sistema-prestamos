# Guía de Instalación y Migración — Sistema Préstamos MISACORP

## 📦 Requisitos del sistema

- **Sistema Operativo:** Windows 10/11 (64 bits)
- **Memoria RAM:** Mínimo 2 GB
- **Espacio en disco:** Mínimo 500 MB libres
- **Resolución de pantalla:** Mínimo 1024 × 600 píxeles

---

## 1️⃣ Instalación desde cero (sin datos previos)

1. Ejecutar `Sistema Prestamos MISACORP Setup 1.0.0.exe` como **Administrador**
2. Elegir carpeta de instalación (ej: `C:\Program Files\MISACORP\`)
3. Marcar "Crear acceso directo en el escritorio"
4. Finalizar la instalación
5. Al abrir la aplicación por primera vez, la base de datos se crea automáticamente con:
   - Usuario admin: `admin@sistema.com` / `admin123`
   - Configuración de empresa por defecto
   - Bóveda inicializada en \$0.00

---

## 2️⃣ Migración desde una versión anterior

Sigue estos pasos **en orden** para conservar todos tus datos al migrar.

### Paso 1 — Localizar la base de datos antigua

La versión anterior guarda la base de datos en:

```
%APPDATA%\sistema-prestamos\database\database.db
```

Para acceder rápido:
1. Presiona `Win + R`, escribe `%APPDATA%\sistema-prestamos\database` y presiona Enter
2. Copia el archivo `database.db` a una carpeta temporal (ej: `C:\temp\backup-db\`)

> ⚠️ No modifiques ni renombres el archivo original por si algo sale mal.

### Paso 2 — Desinstalar la versión anterior

1. Abrir "Configuración de Windows" → "Apps" → "Apps instaladas"
2. Buscar "Sistema Prestamos MISACORP" y desinstalar (los datos en `%APPDATA%` **no se borran**)

### Paso 3 — Instalar la nueva versión

1. Ejecutar `Sistema Prestamos MISACORP Setup 1.0.0.exe` como Administrador
2. Completar la instalación
3. **No abras la aplicación aún**

### Paso 4 — Restaurar la base de datos antigua

1. Ve a la carpeta de datos de la nueva versión:
   ```
   %APPDATA%\sistema-prestamos\database\
   ```
2. Copia allí el `database.db` que respaldaste en el Paso 1 (sobrescribe el archivo existente)

### Paso 5 — Iniciar la aplicación

Al abrir la aplicación por primera vez con tu base de datos antigua:

- ✅ Las **3 nuevas columnas** se añaden automáticamente:
  - `prestamos.motivo_finalizacion` — motivo al finalizar un préstamo
  - `prestamos.fecha_primer_cobro` — fecha del primer cobro
  - `empenos.estado_garantia` — estado de la garantía al finalizar
- ✅ Los registros con estado `retirado` se **migran automáticamente** a `devuelto`
- ✅ Todos tus préstamos, clientes, pagos y empeños se conservan intactos
- ✅ Las contraseñas de usuarios se mantienen

---

## 3️⃣ Estructura de archivos

| Ruta | Propósito |
|------|-----------|
| `%APPDATA%\sistema-prestamos\database\database.db` | Base de datos SQLite |
| `%APPDATA%\sistema-prestamos\public\uploads\` | Fotos de clientes y empeños |
| `C:\Program Files\MISACORP\Sistema Prestamos MISACORP\` | Archivos de la aplicación (solo lectura) |

---

## 4️⃣ Respaldo de seguridad

Se recomienda respaldar periódicamente:

```
%APPDATA%\sistema-prestamos\database\database.db
```

Copia este archivo a una ubicación segura (USB, nube, etc.). Para restaurar, solo reemplaza el archivo en la misma ruta.

---

## 5️⃣ Solución de problemas

| Problema | Solución |
|----------|----------|
| "Base de datos corrupta" al migrar | Restaura el backup de la DB anterior y verifica que no esté dañada ejecutando la versión anterior |
| La aplicación no inicia después de migrar | Borra `%APPDATA%\sistema-prestamos\database\database.db` y vuelve a copiar el backup |
| Error "EBUSY" en el build de Electron | Cierra la aplicación si está abierta y mata procesos Node.js desde el Administrador de Tareas |
| El logo de la empresa no se ve | Vuelve a subir el logo desde Configuración → Empresa |
| Los empeños aparecen duplicados en "Devueltos" | Ejecuta manualmente: `UPDATE empenos SET estado = 'devuelto' WHERE estado = 'retirado'` |
