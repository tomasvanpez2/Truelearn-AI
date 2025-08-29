const fs = require('fs').promises;
const path = require('path');

class TokenLogger {
    constructor() {
        this.logsDir = path.join(__dirname, '../../procesos');
        this.ensureLogsDirectory();
    }

    async ensureLogsDirectory() {
        try {
            await fs.access(this.logsDir);
        } catch (error) {
            await fs.mkdir(this.logsDir, { recursive: true });
        }
    }

    /**
     * Registra el uso de tokens para un usuario específico
     * @param {string} studentName - Nombre del estudiante
     * @param {Object} usage - Información de uso de tokens de la API
     * @param {string} documentInfo - Información adicional sobre el documento
     * @param {string} teacherName - Nombre del profesor que hizo el análisis (opcional)
     */
    async logTokenUsage(studentName, usage, documentInfo = '', teacherName = '') {
        try {
            if (!studentName || !usage) {
                console.warn('Información insuficiente para registrar tokens:', { studentName, usage });
                return;
            }

            // Sanitizar el nombre del archivo
            const sanitizedName = studentName.replace(/[^a-zA-Z0-9\-_]/g, '_');
            const fileName = `${sanitizedName}_tokens.txt`;
            const filePath = path.join(this.logsDir, fileName);

            // Crear entrada de log
            const timestamp = new Date().toISOString();
            const logEntry = this.formatLogEntry(timestamp, usage, documentInfo);

            // Escribir al archivo (append)
            await fs.appendFile(filePath, logEntry + '\n');

            console.log(`Tokens registrados para ${studentName}:`, usage);
        } catch (error) {
            console.error('Error registrando tokens:', error);
        }
    }

    /**
     * Formatea una entrada de log
     * @param {string} timestamp - Timestamp de la operación
     * @param {Object} usage - Información de uso de tokens
     * @param {string} documentInfo - Información del documento
     * @returns {string} - Entrada formateada
     */
    formatLogEntry(timestamp, usage, documentInfo) {
        const {
            prompt_tokens = 0,
            completion_tokens = 0,
            total_tokens = 0
        } = usage;

        return [
            `[${timestamp}]`,
            `Documento: ${documentInfo}`,
            `Tokens de entrada: ${prompt_tokens}`,
            `Tokens de salida: ${completion_tokens}`,
            `Total de tokens: ${total_tokens}`,
            '---'
        ].join(' | ');
    }

    /**
     * Obtiene el resumen de uso de tokens para un usuario
     * @param {string} studentName - Nombre del estudiante
     * @returns {Promise<Object>} - Resumen de uso
     */
    async getTokenSummary(studentName) {
        try {
            const sanitizedName = studentName.replace(/[^a-zA-Z0-9\-_]/g, '_');
            const fileName = `${sanitizedName}_tokens.txt`;
            const filePath = path.join(this.logsDir, fileName);

            try {
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
                    studentName,
                    totalPromptTokens,
                    totalCompletionTokens,
                    totalTokens,
                    requestCount,
                    averageTokensPerRequest: requestCount > 0 ? Math.round(totalTokens / requestCount) : 0
                };
            } catch (fileError) {
                return {
                    studentName,
                    totalPromptTokens: 0,
                    totalCompletionTokens: 0,
                    totalTokens: 0,
                    requestCount: 0,
                    averageTokensPerRequest: 0
                };
            }
        } catch (error) {
            console.error('Error obteniendo resumen de tokens:', error);
            throw error;
        }
    }

    /**
     * Obtiene la lista de todos los usuarios con logs de tokens
     * @returns {Promise<Array>} - Lista de usuarios
     */
    async getAllUsers() {
        try {
            const files = await fs.readdir(this.logsDir);
            return files
                .filter(file => file.endsWith('_tokens.txt'))
                .map(file => file.replace('_tokens.txt', '').replace(/_/g, ' '));
        } catch (error) {
            console.error('Error obteniendo lista de usuarios:', error);
            return [];
        }
    }
}

module.exports = new TokenLogger();