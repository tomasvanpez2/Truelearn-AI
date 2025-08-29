const aiAnalysisTracker = require('./ai-analysis-tracker');

async function createSampleData() {
    console.log('🚀 Creando datos de muestra para el dashboard de IA...');

    // Datos de muestra
    const sampleAnalyses = [
        { studentName: 'María García', aiPercentage: 85, documentName: 'Ensayo sobre el Cambio Climático', grade: '10º' },
        { studentName: 'María García', aiPercentage: 72, documentName: 'Análisis Literario - Don Quijote', grade: '10º' },
        { studentName: 'Juan Pérez', aiPercentage: 45, documentName: 'Informe de Biología', grade: '9º' },
        { studentName: 'Juan Pérez', aiPercentage: 38, documentName: 'Ensayo de Historia', grade: '9º' },
        { studentName: 'Ana Rodríguez', aiPercentage: 92, documentName: 'Proyecto de Física', grade: '11º' },
        { studentName: 'Carlos López', aiPercentage: 15, documentName: 'Redacción Personal', grade: '8º' },
        { studentName: 'Carlos López', aiPercentage: 23, documentName: 'Análisis de Poema', grade: '8º' },
        { studentName: 'Carlos López', aiPercentage: 18, documentName: 'Reporte de Lectura', grade: '8º' },
        { studentName: 'Sofía Martínez', aiPercentage: 67, documentName: 'Ensayo Argumentativo', grade: '10º' },
        { studentName: 'Diego Torres', aiPercentage: 89, documentName: 'Investigación Científica', grade: '11º' },
        { studentName: 'Diego Torres', aiPercentage: 76, documentName: 'Análisis de Datos', grade: '11º' },
        { studentName: 'Valentina Cruz', aiPercentage: 34, documentName: 'Diario de Campo', grade: '9º' },
        { studentName: 'Sebastián Ruiz', aiPercentage: 91, documentName: 'Monografía de Química', grade: '11º' },
        { studentName: 'Isabella Morales', aiPercentage: 28, documentName: 'Crónica Periodística', grade: '10º' },
        { studentName: 'Isabella Morales', aiPercentage: 42, documentName: 'Ensayo Filosófico', grade: '10º' }
    ];

    try {
        for (const analysis of sampleAnalyses) {
            await aiAnalysisTracker.saveAnalysis(
                analysis.studentName,
                analysis.aiPercentage,
                analysis.documentName,
                analysis.grade
            );
            
            // Pequeña pausa para que los timestamps sean diferentes
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log('✅ Datos de muestra creados exitosamente');
        console.log(`📊 Se crearon ${sampleAnalyses.length} análisis de muestra`);
        
        // Mostrar estadísticas
        const stats = await aiAnalysisTracker.getSystemStats();
        console.log('\n📈 Estadísticas del sistema:');
        console.log(`- Estudiantes únicos: ${stats.uniqueStudents}`);
        console.log(`- Total de análisis: ${stats.totalAnalyses}`);
        console.log(`- Promedio de IA: ${stats.averageAI}%`);
        console.log(`- Alta IA (≥70%): ${stats.highAI}`);
        console.log(`- Media IA (30-69%): ${stats.mediumAI}`);
        console.log(`- Baja IA (<30%): ${stats.lowAI}`);

    } catch (error) {
        console.error('❌ Error creando datos de muestra:', error);
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    createSampleData();
}

module.exports = { createSampleData };