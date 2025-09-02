const path = require('path');
const { MIN_TEXT_LENGTH, MAX_TEXT_LENGTH } = process.env;
const apiConfig = require('../config/apiConfig');
const detectionService = require('../services/detectionService');
const dataService = require('../services/dataService');

const analysisController = {
    analyzeDocument: async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No se ha proporcionado ningún archivo'
                });
            }

            // Verificar tokens antes del análisis
            let adminId = null;
            
            // Si el usuario está autenticado, obtener su admin
            if (req.user) {
                if (req.user.role === 'admin') {
                    adminId = req.user.userId;
                } else if (req.user.role === 'teacher') {
                    // Buscar el admin del profesor
                    const teacher = await dataService.findUserById(req.user.userId);
                    adminId = teacher?.adminId;
                }
            }

            // Si tenemos adminId, verificar límite de tokens
            if (adminId) {
                const tokenCheck = await dataService.canAdminAllowTokenUsage(adminId, 2000); // Estimado de tokens por análisis
                
                if (!tokenCheck.allowed) {
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
            
            // Analizar el archivo utilizando el servicio de detección
            const analysisResult = await detectionService.analyzeFile(fileInfo.path, context);
            
            // Los tokens ya se actualizan automáticamente en openaiService.js
            // Solo eliminamos la información de tokens del resultado que se envía al frontend
            if (analysisResult && analysisResult.analysis && analysisResult.analysis.usage) {
                delete analysisResult.analysis.usage;
            }

            return res.json({
                success: true,
                message: 'Análisis completado',
                fileInfo,
                analysis: analysisResult
            });

        } catch (error) {
            console.error('Error en análisis:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al analizar el documento',
                error: error.message
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