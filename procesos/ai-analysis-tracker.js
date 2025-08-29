const fs = require('fs').promises;
const path = require('path');

class AIAnalysisTracker {
    constructor() {
        this.analysisDir = __dirname;
        this.analysisFile = path.join(this.analysisDir, 'ai_analysis_history.json');
    }

    /**
     * Guarda un nuevo análisis de IA
     * @param {string} studentName - Nombre del estudiante
     * @param {number} aiPercentage - Porcentaje de IA detectado
     * @param {string} documentName - Nombre del documento analizado
     * @param {string} grade - Grado del estudiante
     */
    async saveAnalysis(studentName, aiPercentage, documentName, grade = '') {
        try {
            // Leer el archivo existente o crear uno nuevo
            let analysisData = [];
            try {
                const fileContent = await fs.readFile(this.analysisFile, 'utf8');
                analysisData = JSON.parse(fileContent);
            } catch (error) {
                // El archivo no existe, se creará uno nuevo
                analysisData = [];
            }

            // Crear el nuevo registro
            const newAnalysis = {
                studentName: studentName.trim(),
                aiPercentage: parseFloat(aiPercentage),
                documentName: documentName || 'Documento sin nombre',
                grade: grade || '',
                timestamp: new Date().toISOString(),
                date: new Date().toLocaleDateString('es-ES')
            };

            // Agregar el nuevo análisis
            analysisData.push(newAnalysis);

            // Guardar el archivo actualizado
            await fs.writeFile(this.analysisFile, JSON.stringify(analysisData, null, 2));
            
            console.log(`✅ Análisis guardado para ${studentName}: ${aiPercentage}% IA`);
            return true;
        } catch (error) {
            console.error('Error guardando análisis de IA:', error);
            return false;
        }
    }

    /**
     * Obtiene el historial de análisis agrupado por estudiante
     */
    async getAnalysisHistory() {
        try {
            const fileContent = await fs.readFile(this.analysisFile, 'utf8');
            const analysisData = JSON.parse(fileContent);

            // Agrupar por estudiante
            const groupedData = {};
            
            analysisData.forEach(analysis => {
                const studentName = analysis.studentName;
                
                if (!groupedData[studentName]) {
                    groupedData[studentName] = {
                        studentName: studentName,
                        grade: analysis.grade,
                        analyses: [],
                        averageAI: 0,
                        totalAnalyses: 0
                    };
                }
                
                groupedData[studentName].analyses.push({
                    aiPercentage: analysis.aiPercentage,
                    documentName: analysis.documentName,
                    date: analysis.date,
                    timestamp: analysis.timestamp
                });
            });

            // Calcular promedios y ordenar
            Object.keys(groupedData).forEach(studentName => {
                const student = groupedData[studentName];
                student.totalAnalyses = student.analyses.length;
                
                const totalAI = student.analyses.reduce((sum, analysis) => sum + analysis.aiPercentage, 0);
                student.averageAI = student.totalAnalyses > 0 ? (totalAI / student.totalAnalyses).toFixed(1) : 0;
                
                // Ordenar análisis por fecha (más reciente primero)
                student.analyses.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            });

            // Convertir a array y ordenar por promedio de IA (mayor a menor)
            const result = Object.values(groupedData).sort((a, b) => parseFloat(b.averageAI) - parseFloat(a.averageAI));
            
            return result;
        } catch (error) {
            console.error('Error obteniendo historial de análisis:', error);
            return [];
        }
    }

    /**
     * Obtiene estadísticas generales del sistema
     */
    async getSystemStats() {
        try {
            const fileContent = await fs.readFile(this.analysisFile, 'utf8');
            const analysisData = JSON.parse(fileContent);

            const totalAnalyses = analysisData.length;
            const uniqueStudents = new Set(analysisData.map(a => a.studentName)).size;
            
            const totalAI = analysisData.reduce((sum, analysis) => sum + analysis.aiPercentage, 0);
            const averageAI = totalAnalyses > 0 ? (totalAI / totalAnalyses).toFixed(1) : 0;

            // Análisis por rango de IA
            const highAI = analysisData.filter(a => a.aiPercentage >= 70).length;
            const mediumAI = analysisData.filter(a => a.aiPercentage >= 30 && a.aiPercentage < 70).length;
            const lowAI = analysisData.filter(a => a.aiPercentage < 30).length;

            return {
                totalAnalyses,
                uniqueStudents,
                averageAI: parseFloat(averageAI),
                highAI,
                mediumAI,
                lowAI
            };
        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            return {
                totalAnalyses: 0,
                uniqueStudents: 0,
                averageAI: 0,
                highAI: 0,
                mediumAI: 0,
                lowAI: 0
            };
        }
    }

    /**
     * Obtiene el historial de un estudiante específico
     */
    async getStudentHistory(studentName) {
        try {
            const fileContent = await fs.readFile(this.analysisFile, 'utf8');
            const analysisData = JSON.parse(fileContent);

            const studentAnalyses = analysisData.filter(a => 
                a.studentName.toLowerCase() === studentName.toLowerCase()
            );

            if (studentAnalyses.length === 0) {
                return null;
            }

            // Ordenar por fecha (más reciente primero)
            studentAnalyses.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            const totalAI = studentAnalyses.reduce((sum, analysis) => sum + analysis.aiPercentage, 0);
            const averageAI = (totalAI / studentAnalyses.length).toFixed(1);

            return {
                studentName: studentAnalyses[0].studentName,
                grade: studentAnalyses[0].grade,
                totalAnalyses: studentAnalyses.length,
                averageAI: parseFloat(averageAI),
                analyses: studentAnalyses
            };
        } catch (error) {
            console.error('Error obteniendo historial del estudiante:', error);
            return null;
        }
    }
}

module.exports = new AIAnalysisTracker();