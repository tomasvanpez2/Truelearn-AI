const dataService = require('../services/dataService');

/**
 * Middleware para verificar que el admin tenga tokens suficientes antes de hacer análisis
 * Solo aplica para admins y profesores. Los estudiantes NO tienen límite de tokens.
 */
const checkTokensBeforeAnalysis = async (req, res, next) => {
    try {
        let adminId = null;
        let userRole = null;
        
        // Si el usuario está autenticado, obtener su admin
        if (req.user) {
            userRole = req.user.role;
            if (req.user.role === 'admin') {
                adminId = req.user.userId;
            } else if (req.user.role === 'teacher') {
                // Buscar el admin del profesor
                const teacher = await dataService.findUserById(req.user.userId);
                adminId = teacher?.adminId;
            }
            // Los estudiantes NO tienen límite de tokens, no verificamos nada
        }

        // Si no hay adminId o es estudiante, permitir el análisis
        if (!adminId || userRole === 'student') {
            return next();
        }

        // Solo verificar límite para admins y profesores
        // Verificar límite de tokens (estimamos 2000 tokens por análisis)
        const estimatedTokens = 2000;
        const tokenCheck = await dataService.canAdminAllowTokenUsage(adminId, estimatedTokens);
        
        if (!tokenCheck.allowed) {
            return res.status(403).json({
                success: false,
                message: '❌ El administrador ha alcanzado su límite de tokens',
                tokenExhausted: true,
                details: {
                    tokensUsados: tokenCheck.currentUsed,
                    limite: tokenCheck.limit,
                    tokensRestantes: tokenCheck.remaining,
                    tokensRequeridos: estimatedTokens,
                    exceso: tokenCheck.excess,
                    razon: tokenCheck.reason,
                    userRole: userRole
                },
                alert: {
                    title: 'Tokens Agotados',
                    message: `El administrador ha alcanzado su límite de ${tokenCheck.limit.toLocaleString()} tokens. Tokens usados: ${tokenCheck.currentUsed.toLocaleString()}`,
                    type: 'error'
                }
            });
        }

        // Agregar adminId al request para uso posterior
        req.adminId = adminId;
        next();
        
    } catch (error) {
        console.error('Error verificando tokens:', error);
        return res.status(500).json({
            success: false,
            message: 'Error verificando disponibilidad de tokens',
            error: error.message
        });
    }
};

/**
 * Middleware para actualizar tokens después de un análisis exitoso
 */
const updateTokensAfterAnalysis = (tokensUsed) => {
    return async (req, res, next) => {
        try {
            if (req.adminId && tokensUsed > 0) {
                const currentTokens = await dataService.getAdminTokensWithAccumulatedUsage(req.adminId);
                if (currentTokens) {
                    await dataService.updateTokens(req.adminId, {
                        used: currentTokens.adminDirectUsage + tokensUsed,
                        limit: currentTokens.limit
                    });
                    console.log(`Tokens actualizados para admin ${req.adminId}: +${tokensUsed} tokens`);
                }
            }
            next();
        } catch (error) {
            console.error('Error actualizando tokens:', error);
            // No bloquear la respuesta por error en actualización de tokens
            next();
        }
    };
};

module.exports = {
    checkTokensBeforeAnalysis,
    updateTokensAfterAnalysis
};