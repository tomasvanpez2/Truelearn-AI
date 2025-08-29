const fs = require('fs').promises;
const path = require('path');

class TokenReportGenerator {
    constructor() {
        this.logsDir = __dirname;
        this.reportsDir = path.join(__dirname, 'reportes');
    }

    async ensureReportsDirectory() {
        try {
            await fs.access(this.reportsDir);
        } catch (error) {
            await fs.mkdir(this.reportsDir, { recursive: true });
        }
    }

    async generateDailyReport() {
        try {
            await this.ensureReportsDirectory();
            
            const files = await fs.readdir(this.logsDir);
            const tokenFiles = files.filter(file => file.endsWith('_tokens.txt'));
            
            const today = new Date().toISOString().split('T')[0];
            const reportPath = path.join(this.reportsDir, `reporte_diario_${today}.txt`);
            
            let report = `REPORTE DIARIO DE CONSUMO DE TOKENS\n`;
            report += `Fecha: ${new Date().toLocaleDateString('es-ES')}\n`;
            report += `Hora de generación: ${new Date().toLocaleTimeString('es-ES')}\n`;
            report += `${'='.repeat(60)}\n\n`;
            
            let totalSystemTokens = 0;
            let totalSystemRequests = 0;
            const userSummaries = [];
            
            for (const file of tokenFiles) {
                const studentName = file.replace('_tokens.txt', '').replace(/_/g, ' ');
                const summary = await this.getUserSummary(file);
                
                if (summary.totalTokens > 0) {
                    userSummaries.push({
                        name: studentName,
                        ...summary
                    });
                    
                    totalSystemTokens += summary.totalTokens;
                    totalSystemRequests += summary.requestCount;
                }
            }
            
            // Estadísticas generales
            report += `ESTADÍSTICAS GENERALES:\n`;
            report += `- Total de usuarios activos: ${userSummaries.length}\n`;
            report += `- Total de tokens consumidos: ${totalSystemTokens.toLocaleString()}\n`;
            report += `- Total de solicitudes: ${totalSystemRequests}\n`;
            report += `- Promedio de tokens por usuario: ${userSummaries.length > 0 ? Math.round(totalSystemTokens / userSummaries.length).toLocaleString() : 0}\n`;
            report += `- Promedio de tokens por solicitud: ${totalSystemRequests > 0 ? Math.round(totalSystemTokens / totalSystemRequests) : 0}\n\n`;
            
            // Ordenar usuarios por consumo
            userSummaries.sort((a, b) => b.totalTokens - a.totalTokens);
            
            report += `RANKING DE USUARIOS POR CONSUMO:\n`;
            report += `${'='.repeat(60)}\n`;
            
            userSummaries.forEach((user, index) => {
                report += `${index + 1}. ${user.name}\n`;
                report += `   - Total de tokens: ${user.totalTokens.toLocaleString()}\n`;
                report += `   - Tokens de entrada: ${user.totalPromptTokens.toLocaleString()}\n`;
                report += `   - Tokens de salida: ${user.totalCompletionTokens.toLocaleString()}\n`;
                report += `   - Número de solicitudes: ${user.requestCount}\n`;
                report += `   - Promedio por solicitud: ${user.averageTokensPerRequest}\n`;
                report += `   - Porcentaje del total: ${((user.totalTokens / totalSystemTokens) * 100).toFixed(2)}%\n\n`;
            });
            
            // Top 5 usuarios
            report += `TOP 5 USUARIOS CON MAYOR CONSUMO:\n`;
            report += `${'='.repeat(40)}\n`;
            userSummaries.slice(0, 5).forEach((user, index) => {
                report += `${index + 1}. ${user.name}: ${user.totalTokens.toLocaleString()} tokens\n`;
            });
            
            await fs.writeFile(reportPath, report);
            console.log(`Reporte generado: ${reportPath}`);
            
            return reportPath;
        } catch (error) {
            console.error('Error generando reporte:', error);
            throw error;
        }
    }
    
    async getUserSummary(fileName) {
        try {
            const filePath = path.join(this.logsDir, fileName);
            const content = await fs.readFile(filePath, 'utf8');
            const lines = content.split('\n').filter(line => line.trim());
            
            let totalPromptTokens = 0;
            let totalCompletionTokens = 0;
            let totalTokens = 0;
            let requestCount = 0;
            
            lines.forEach(line => {
                if (line.includes('Total de tokens:')) {
                    const promptMatch = line.match(/Tokens de entrada: (\d+)/);
                    const completionMatch = line.match(/Tokens de salida: (\d+)/);
                    const totalMatch = line.match(/Total de tokens: (\d+)/);
                    
                    if (promptMatch) totalPromptTokens += parseInt(promptMatch[1]);
                    if (completionMatch) totalCompletionTokens += parseInt(completionMatch[1]);
                    if (totalMatch) totalTokens += parseInt(totalMatch[1]);
                    requestCount++;
                }
            });
            
            return {
                totalPromptTokens,
                totalCompletionTokens,
                totalTokens,
                requestCount,
                averageTokensPerRequest: requestCount > 0 ? Math.round(totalTokens / requestCount) : 0
            };
        } catch (error) {
            return {
                totalPromptTokens: 0,
                totalCompletionTokens: 0,
                totalTokens: 0,
                requestCount: 0,
                averageTokensPerRequest: 0
            };
        }
    }
    
    async generateUserReport(studentName) {
        try {
            await this.ensureReportsDirectory();
            
            const sanitizedName = studentName.replace(/[^a-zA-Z0-9\-_]/g, '_');
            const fileName = `${sanitizedName}_tokens.txt`;
            const filePath = path.join(this.logsDir, fileName);
            
            try {
                const content = await fs.readFile(filePath, 'utf8');
                const today = new Date().toISOString().split('T')[0];
                const reportPath = path.join(this.reportsDir, `reporte_${sanitizedName}_${today}.txt`);
                
                let report = `REPORTE INDIVIDUAL DE CONSUMO DE TOKENS\n`;
                report += `Estudiante: ${studentName}\n`;
                report += `Fecha: ${new Date().toLocaleDateString('es-ES')}\n`;
                report += `Hora de generación: ${new Date().toLocaleTimeString('es-ES')}\n`;
                report += `${'='.repeat(60)}\n\n`;
                
                const summary = await this.getUserSummary(fileName);
                
                report += `RESUMEN:\n`;
                report += `- Total de tokens consumidos: ${summary.totalTokens.toLocaleString()}\n`;
                report += `- Tokens de entrada: ${summary.totalPromptTokens.toLocaleString()}\n`;
                report += `- Tokens de salida: ${summary.totalCompletionTokens.toLocaleString()}\n`;
                report += `- Número de solicitudes: ${summary.requestCount}\n`;
                report += `- Promedio de tokens por solicitud: ${summary.averageTokensPerRequest}\n\n`;
                
                report += `HISTORIAL DETALLADO:\n`;
                report += `${'='.repeat(60)}\n`;
                report += content;
                
                await fs.writeFile(reportPath, report);
                console.log(`Reporte individual generado: ${reportPath}`);
                
                return reportPath;
            } catch (fileError) {
                throw new Error(`No se encontraron datos para el usuario: ${studentName}`);
            }
        } catch (error) {
            console.error('Error generando reporte individual:', error);
            throw error;
        }
    }
}

// Función principal para ejecutar desde línea de comandos
async function main() {
    const generator = new TokenReportGenerator();
    
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        // Generar reporte diario
        try {
            const reportPath = await generator.generateDailyReport();
            console.log(`✅ Reporte diario generado exitosamente: ${reportPath}`);
        } catch (error) {
            console.error('❌ Error generando reporte diario:', error.message);
        }
    } else if (args[0] === '--user' && args[1]) {
        // Generar reporte individual
        try {
            const reportPath = await generator.generateUserReport(args[1]);
            console.log(`✅ Reporte individual generado exitosamente: ${reportPath}`);
        } catch (error) {
            console.error('❌ Error generando reporte individual:', error.message);
        }
    } else {
        console.log('Uso:');
        console.log('  node generate-report.js                    # Generar reporte diario');
        console.log('  node generate-report.js --user "Nombre"    # Generar reporte individual');
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    main();
}

module.exports = TokenReportGenerator;