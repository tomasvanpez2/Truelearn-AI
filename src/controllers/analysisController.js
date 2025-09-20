const path = require('path');
const { MIN_TEXT_LENGTH, MAX_TEXT_LENGTH } = process.env;
const apiConfig = require('../config/apiConfig');
const detectionService = require('../services/detectionService');
const dataService = require('../services/dataService');

const analysisController = {
    analyzeDocument: async (req, res) => {
        try {
            console.log('🔍 [DEBUG] Iniciando análisis de documento');
            console.log('🔍 [DEBUG] Archivo recibido:', req.file ? req.file.filename : 'NINGUNO');
            console.log('🔍 [DEBUG] Usuario autenticado:', req.user ? req.user.userId : 'NO AUTH');

            if (!req.file) {
                console.log('❌ [DEBUG] Error: No se ha proporcionado ningún archivo');
                return res.status(400).json({
                    success: false,
                    message: 'No se ha proporcionado ningún archivo'
                });
            }

            // Verificar tokens antes del análisis
            let adminId = null;
            console.log('🔍 [DEBUG] Verificando tokens...');

            // Si el usuario está autenticado, obtener su admin
            if (req.user) {
                console.log('🔍 [DEBUG] Usuario autenticado, rol:', req.user.role);
                if (req.user.role === 'admin') {
                    adminId = req.user.userId;
                    console.log('🔍 [DEBUG] Admin ID:', adminId);
                } else if (req.user.role === 'teacher') {
                    // Buscar el admin del profesor
                    console.log('🔍 [DEBUG] Buscando admin del profesor...');
                    const teacher = await dataService.findUserById(req.user.userId);
                    adminId = teacher?.adminId;
                    console.log('🔍 [DEBUG] Admin ID del profesor:', adminId);
                }
            } else {
                console.log('⚠️ [DEBUG] Usuario no autenticado');
            }

            // Si tenemos adminId, verificar límite de tokens
            if (adminId) {
                console.log('🔍 [DEBUG] Verificando límite de tokens para admin:', adminId);
                const tokenCheck = await dataService.canAdminAllowTokenUsage(adminId, 2000); // Estimado de tokens por análisis
                console.log('🔍 [DEBUG] Resultado verificación tokens:', tokenCheck);

                if (!tokenCheck.allowed) {
                    console.log('❌ [DEBUG] Tokens insuficientes');
                    return res.status(403).json({
                        success: false,
                        message: '❌ No tienes suficientes tokens para realizar este análisis',
                        tokenExhausted: true,
                        details: {
                            tokensUsados: tokenCheck.currentUsed,
                            limite: tokenCheck.limit,
                            tokensRestantes: tokenCheck.remaining,
                            razon: tokenCheck.reason
                        }
                    });
                }
                console.log('✅ [DEBUG] Tokens suficientes');
            } else {
                console.log('⚠️ [DEBUG] No se verificaron tokens (sin adminId)');
            }

            const fileInfo = {
                filename: req.file.filename,
                path: req.file.path,
                size: req.file.size,
                mimetype: req.file.mimetype
            };

            // Extraer información del contexto académico del formulario
            const context = {
                studentName: req.body.studentName || '',
                studentGrade: req.body.studentGrade || '',
                attendanceHours: req.body.attendanceHours || '',
                totalHours: req.body.totalHours || '',
                topics: req.body.topics ? JSON.parse(req.body.topics) : [],
                additionalContext: req.body.context || '',
                documentName: req.file.originalname || req.file.filename,
                adminId: adminId // Pasar adminId al contexto
            };

            console.log('🔍 [DEBUG] Contexto extraído:', context);
            console.log('🔍 [DEBUG] Llamando a detectionService.analyzeFile...');

            // Analizar el archivo utilizando el servicio de detección
            const analysisResult = await detectionService.analyzeFile(fileInfo.path, context);
            console.log('🔍 [DEBUG] Resultado del análisis:', analysisResult ? 'OK' : 'NULL');

            // Los tokens ya se actualizan automáticamente en openaiService.js
            // Solo eliminamos la información de tokens del resultado que se envía al frontend
            if (analysisResult && analysisResult.analysis && analysisResult.analysis.usage) {
                delete analysisResult.analysis.usage;
            }

            console.log('✅ [DEBUG] Análisis completado exitosamente');
            return res.json({
                success: true,
                message: 'Análisis completado',
                fileInfo,
                analysis: analysisResult
            });

        } catch (error) {
            console.error('❌ [DEBUG] Error en análisis:', error);
            console.error('❌ [DEBUG] Stack trace:', error.stack);
            console.error('❌ [DEBUG] Tipo de error:', error.constructor.name);
            return res.status(500).json({
                success: false,
                message: 'Error al analizar el documento',
                error: error.message,
                debug: {
                    type: error.constructor.name,
                    stack: error.stack
                }
            });
        }
    },

    getAnalysisResults: async (req, res) => {
        try {
            const { fileId } = req.params;

            // Aquí se implementará la lógica para recuperar resultados
            // Por ahora devolvemos una respuesta simulada
            const results = {
                fileId,
                status: 'completed',
                probability: 0.75,
                confidence: 'alta',
                details: 'Se detectaron patrones consistentes con IA',
                timestamp: new Date().toISOString()
            };

            return res.json({
                success: true,
                results
            });

        } catch (error) {
            console.error('Error al obtener resultados:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener resultados del análisis',
                error: error.message
            });
        }
    }
};

module.exports = analysisController;