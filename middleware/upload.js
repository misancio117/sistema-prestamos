const multer = require('multer');
const path = require('path');

const fs = require('fs');

// Configuración de almacenamiento
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Usar APP_DATA_PATH para escritura si está disponible
        const basePath = process.env.APP_DATA_PATH || path.join(__dirname, '..');
        const uploadDir = path.join(basePath, 'public', 'uploads');
        
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Nombre único: FechaActual + NombreOriginal
        const unico = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, unico + path.extname(file.originalname));
    }
});

// Filtro para validar que sea imagen (jpg, png, jpeg)
const fileFilter = (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
        return cb(null, true);
    }
    cb(new Error('Error: El archivo debe ser una imagen válida (jpeg, jpg, png, webp)'));
};

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Límite de 5MB
    fileFilter: fileFilter
});

module.exports = upload;