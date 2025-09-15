// Cargar variables de entorno al inicio
require('dotenv').config();

const express = require('express');
const path = require('path');
const multer = require('multer');
const cors = require('cors');
// MongoDB removido - usando solo JSON
const authRoutes = require('./routes/auth');
const analysisRoutes = require('./routes/analysis');
const usersRoutes = require('./routes/users');
const teacherRoutes = require('./routes/teachers');
const teacherProfileRoutes = require('./routes/teacher');
const adminRoutes = require('./routes/admin');
const studentsRoutes = require('./routes/students');
const themesRoutes = require('./routes/themes');
const tokenRoutes = require('./routes/tokens');
const coursesRoutes = require('./routes/courses');
const platformRoutes = require('./routes/platform');
const aiAnalysisRoutes = require('./routes/aiAnalysis');

const app = express();
const port = process.env.PORT || 3000;

// Sistema configurado para usar solo archivos JSON
console.log('🟢 Sistema configurado para usar archivos JSON como base de datos');

// Configuración de middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        const allowedTypes = ['.txt', '.docx', '.pptx', '.xlsx'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de archivo no soportado'));
        }
    }
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/teacher', teacherProfileRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/themes', themesRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/platform', platformRoutes);
app.use('/api/ai-analysis', aiAnalysisRoutes);

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Ruta del dashboard (protegida por verificación de token en el frontend)
app.get('/dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

// Ruta de gestión de profesores (protegida por verificación de token en el frontend)
app.get('/teachers-management.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/teachers-management.html'));
});

// Ruta de gestión de estudiantes (protegida por verificación de token en el frontend)
app.get('/students-management.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/students-management.html'));
});

// Ruta alternativa para manejar error tipográfico
app.get('/students-mangament.html', (req, res) => {
    res.redirect('/students-management.html');
});

// Manejo de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: err.message
    });
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`Servidor iniciado en http://localhost:${port}`);
});