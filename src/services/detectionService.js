const fileParser = require('./fileParser');
const openaiService = require('./openaiService');
const aiAnalysisTracker = require('../../procesos/ai-analysis-tracker');

class DetectionService {
    constructor() {
        this.openaiService = openaiService;
    }

    /**
     * Analiza un archivo para detectar si fue generado por IA
     * @param {string} filePath - Ruta del archivo a analizar
     * @param {Object} context - Contexto académico del documento
     * @returns {Promise<Object>} - Resultado del análisis
     */
    async analyzeFile(filePath, context) {
        try {
            // Extraer texto del archivo
            const extractedText = await fileParser.extractText(filePath);
            
            // Verificar que el texto tenga un tamaño adecuado
            if (!extractedText || extractedText.trim().length < 10) {
                throw new Error('El texto extraído es demasiado corto para un análisis preciso');
            }

            // Enviar el texto a la API para análisis
            const analysisResult = await this.openaiService.analyzeText(extractedText, context);
            
            // Extraer el porcentaje de IA del resultado
            if (analysisResult && analysisResult.content && context.studentName) {
                const aiPercentage = this.extractAIPercentage(analysisResult.content);
                if (aiPercentage !== null) {
                    // Guardar el análisis en el tracker
                    await aiAnalysisTracker.saveAnalysis(
                        context.studentName,
                        aiPercentage,
                        context.documentName || 'Documento',
                        context.studentGrade || ''
                    );
                }
            }
            
            return {
                success: true,
                text: extractedText.substring(0, 500) + '...', // Muestra solo una parte del texto
                analysis: analysisResult
            };
        } catch (error) {
            console.error('Error en el servicio de detección:', error);
            throw error;
        }
    }

    /**
     * Extrae el porcentaje de IA del contenido del análisis
     * @param {string} content - Contenido del análisis
     * @returns {number|null} - Porcentaje de IA o null si no se encuentra
     */
    extractAIPercentage(content) {
        try {
            // Buscar patrones de porcentaje en el texto
            const percentagePatterns = [
                /(\d+(?:\.\d+)?)\s*%/g,
                /(\d+(?:\.\d+)?)\s*por\s*ciento/gi,
                /probabilidad.*?(\d+(?:\.\d+)?)/gi,
                /porcentaje.*?(\d+(?:\.\d+)?)/gi
            ];

            for (const pattern of percentagePatterns) {
                const matches = content.match(pattern);
                if (matches && matches.length > 0) {
                    // Tomar el primer porcentaje encontrado
                    const percentageMatch = matches[0].match(/(\d+(?:\.\d+)?)/);
                    if (percentageMatch) {
                        const percentage = parseFloat(percentageMatch[1]);
                        // Validar que esté en un rango razonable (0-100)
                        if (percentage >= 0 && percentage <= 100) {
                            return percentage;
                        }
                    }
                }
            }
            
            return null;
        } catch (error) {
            console.error('Error extrayendo porcentaje de IA:', error);
            return null;
        }
    }

    /**
     * Genera preguntas para verificar la autoría del documento
     * @param {string} filePath - Ruta del archivo
     * @param {Object} context - Contexto académico del documento
     * @returns {Promise<Object>} - Preguntas generadas
     */
    async generateQuestions(filePath, context) {
        try {
            // Extraer texto del archivo
            const extractedText = await fileParser.extractText(filePath);
            
            // Generar preguntas basadas en el contenido
            const questionsResult = await this.openaiService.generateQuestions(extractedText, context);
            
            return {
                success: true,
                questions: questionsResult
            };
        } catch (error) {
            console.error('Error generando preguntas:', error);
            throw error;
        }
    }
}

module.exports = new DetectionService();