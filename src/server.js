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
app.use(cors({
    origin: true, // Permitir cualquier origen para debugging
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With']
}));
app.use(express.json({ limit: '50mb' })); // Aumentar límite para archivos grandes
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, '../public')));

// Middleware adicional para headers CORS explícitos
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

    // Manejar preflight requests
    if (req.method === 'OPTIONS') {
        console.log('🔄 [CORS-DEBUG] Preflight request recibido');
        res.sendStatus(200);
        return;
    }

    next();
});

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

// Middleware para loggear todas las respuestas HTTP
app.use((req, res, next) => {
    const originalSend = res.send;
    const originalJson = res.json;
    const originalStatus = res.status;

    // Loggear el inicio de la solicitud
    console.log('🌐 [HTTP-DEBUG] Solicitud entrante:', {
        method: req.method,
        url: req.url,
        headers: {
            'content-type': req.headers['content-type'],
            'authorization': req.headers.authorization ? 'Bearer [PRESENTE]' : 'No presente',
            'user-agent': req.headers['user-agent']
        }
    });

    // Interceptar res.status()
    res.status = function(code) {
        console.log('📊 [HTTP-DEBUG] Estableciendo status code:', code);
        return originalStatus.call(this, code);
    };

    // Interceptar res.json()
    res.json = function(data) {
        console.log('📤 [HTTP-DEBUG] Enviando respuesta JSON:', {
            status: res.statusCode,
            dataType: typeof data,
            hasSuccess: data && typeof data === 'object' && 'success' in data,
            dataKeys: data && typeof data === 'object' ? Object.keys(data) : 'N/A'
        });

        // Verificar que la respuesta esté bien formada
        if (res.statusCode >= 200 && res.statusCode < 300) {
            if (!data || typeof data !== 'object' || !('success' in data)) {
                console.error('⚠️ [HTTP-WARN] Respuesta exitosa sin estructura esperada');
            }
        }

        return originalJson.call(this, data);
    };

    // Interceptar res.send()
    res.send = function(data) {
        console.log('📤 [HTTP-DEBUG] Enviando respuesta SEND:', {
            status: res.statusCode,
            dataType: typeof data,
            dataLength: data ? data.length : 0,
            isHtml: typeof data === 'string' && data.includes('<html')
        });
        return originalSend.call(this, data);
    };

    next();
});

// Manejo de errores
app.use((err, req, res, next) => {
    console.error('❌ [502-DEBUG] Error en el servidor:', err.message);
    console.error('❌ [502-DEBUG] Stack trace:', err.stack);
    console.error('❌ [502-DEBUG] Error status:', err.status || 'No status');
    console.error('❌ [502-DEBUG] Request URL:', req.url);
    console.error('❌ [502-DEBUG] Request method:', req.method);

    // Detectar específicamente errores 502
    if (err.status === 502 || err.message.includes('502') || err.message.includes('Bad Gateway')) {
        console.error('🚨 [502-ALERT] Error 502 Bad Gateway detectado');
        console.error('🚨 [502-ALERT] Posible causa: Respuesta inválida del upstream (OpenRouter)');
    }

    // Asegurar que la respuesta de error esté bien formada
    const errorResponse = {
        success: false,
        message: err.status === 502 ? 'Error 502: Bad Gateway - Problema con el servicio upstream' : 'Error interno del servidor',
        error: err.message,
        debug: {
            status: err.status,
            url: req.url,
            method: req.method,
            timestamp: new Date().toISOString()
        }
    };

    console.log('📤 [HTTP-DEBUG] Enviando respuesta de error:', {
        status: err.status || 500,
        responseKeys: Object.keys(errorResponse)
    });

    res.status(err.status || 500).json(errorResponse);
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`Servidor iniciado en http://localhost:${port}`);
});