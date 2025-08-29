const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { MIN_TEXT_LENGTH, MAX_TEXT_LENGTH } = process.env;
const { verifyToken } = require('../middleware/authMiddleware');

// Configuración de multer para la subida de archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../uploads'));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1000 * 1024 * 1024 // 1000MB (1GB) según el valor en .env
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.txt', '.docx', '.pptx', '.xlsx'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de archivo no soportado'));
        }
    }
});

const analysisController = require('../controllers/analysisController');

// Ruta para subir y analizar documento
router.post('/upload', verifyToken, upload.single('document'), analysisController.analyzeDocument);

// Ruta para obtener resultados del análisis
router.get('/results/:fileId', verifyToken, analysisController.getAnalysisResults);

module.exports = router;