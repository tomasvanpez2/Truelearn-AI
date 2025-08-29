const tokenLogger = require('../utils/tokenLogger');
const fs = require('fs').promises;
const path = require('path');

const tokenController = {
    /**
     * Obtiene el resumen de tokens para un usuario específico
     */
    getUserTokenSummary: async (req, res) => {
        try {
            const { studentName } = req.params;
            
            if (!studentName) {
                return res.status(400).json({
                    success: false,
                    message: 'Nombre de estudiante requerido'
                });
            }

            const summary = await tokenLogger.getTokenSummary(studentName);
            
            return res.json({
                success: true,
                data: summary
            });
        } catch (error) {
            console.error('Error obteniendo resumen de tokens:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener resumen de tokens',
                error: error.message
            });
        }
    },

    /**
     * Obtiene el resumen de tokens para todos los usuarios
     */
    getAllTokenSummaries: async (req, res) => {
        try {
            const users = await tokenLogger.getAllUsers();
            const summaries = [];

            for (const user of users) {
                const summary = await tokenLogger.getTokenSummary(user);
                summaries.push(summary);
            }

            // Ordenar por total de tokens descendente
            summaries.sort((a, b) => b.totalTokens - a.totalTokens);

            return res.json({
                success: true,
                data: summaries,
                totalUsers: summaries.length
            });
        } catch (error) {
            console.error('Error obteniendo todos los resúmenes:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener resúmenes de tokens',
                error: error.message
            });
        }
    },

    /**
     * Obtiene el log completo de un usuario específico
     */
    getUserTokenLog: async (req, res) => {
        try {
            const { studentName } = req.params;
            
            if (!studentName) {
                return res.status(400).json({
                    success: false,
                    message: 'Nombre de estudiante requerido'
                });
            }

            const sanitizedName = studentName.replace(/[^a-zA-Z0-9\-_]/g, '_');
            const fileName = `${sanitizedName}_tokens.txt`;
            const filePath = path.join(__dirname, '../../procesos', fileName);

            try {
                const content = await fs.readFile(filePath, 'utf8');
                
                return res.json({
                    success: true,
                    data: {
                        studentName,
                        logContent: content,
                        fileName
                    }
                });
            } catch (fileError) {
                return res.json({
                    success: true,
                    data: {
                        studentName,
                        logContent: 'No hay registros de tokens para este usuario',
                        fileName
                    }
                });
            }
        } catch (error) {
            console.error('Error obteniendo log de tokens:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener log de tokens',
                error: error.message
            });
        }
    },

    /**
     * Obtiene estadísticas generales del sistema
     */
    getSystemStats: async (req, res) => {
        try {
            const users = await tokenLogger.getAllUsers();
            const summaries = [];
            let totalSystemTokens = 0;
            let totalSystemRequests = 0;

            for (const user of users) {
                const summary = await tokenLogger.getTokenSummary(user);
                summaries.push(summary);
                totalSystemTokens += summary.totalTokens;
                totalSystemRequests += summary.requestCount;
            }

            const stats = {
                totalUsers: users.length,
                totalSystemTokens,
                totalSystemRequests,
                averageTokensPerUser: users.length > 0 ? Math.round(totalSystemTokens / users.length) : 0,
                averageRequestsPerUser: users.length > 0 ? Math.round(totalSystemRequests / users.length) : 0,
                topUsers: summaries
                    .sort((a, b) => b.totalTokens - a.totalTokens)
                    .slice(0, 5)
                    .map(user => ({
                        name: user.studentName,
                        totalTokens: user.totalTokens,
                        requestCount: user.requestCount
                    }))
            };

            return res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Error obteniendo estadísticas del sistema:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener estadísticas del sistema',
                error: error.message
            });
        }
    }
};

module.exports = tokenController;