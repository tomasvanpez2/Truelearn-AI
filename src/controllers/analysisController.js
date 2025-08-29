const path = require('path');
const { MIN_TEXT_LENGTH, MAX_TEXT_LENGTH } = process.env;
const apiConfig = require('../config/apiConfig');
const detectionService = require('../services/detectionService');

const analysisController = {
    analyzeDocument: async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No se ha proporcionado ningún archivo'
                });
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
                documentName: req.file.originalname || req.file.filename
            };
            
            // Analizar el archivo utilizando el servicio de detección
            const analysisResult = await detectionService.analyzeFile(fileInfo.path, context);
            
            // Eliminar la información de tokens antes de enviarla al frontend
            if (analysisResult && analysisResult.analysis && analysisResult.analysis.usage) {
                // Guardar la información de tokens en una variable temporal por si se necesita para depuración
                const tokenInfo = analysisResult.analysis.usage;
                console.log('Información de tokens registrada:', tokenInfo);
                
                // Eliminar la información de tokens del resultado que se envía al frontend
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