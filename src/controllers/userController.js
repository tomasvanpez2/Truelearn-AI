const dataService = require('../services/dataService');

const userController = {
    // Obtener todos los usuarios (solo para super admin)
    getAllUsers: async (req, res) => {
        try {
            const users = dataService.loadUsers();
            
            return res.json({
                success: true,
                users: users.map(user => {
                    const { password, ...userWithoutPassword } = user;
                    return userWithoutPassword;
                })
            });
        } catch (error) {
            console.error('Error obteniendo usuarios:', error);
            return res.status(500).json({
                success: false,
                message: 'Error en el servidor'
            });
        }
    },

    // Obtener un usuario específico
    getUserById: async (req, res) => {
        try {
            const { id } = req.params;
            const user = dataService.findUserById(id);
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            const { password, ...userWithoutPassword } = user;
            return res.json({
                success: true,
                user: userWithoutPassword
            });
        } catch (error) {
            console.error('Error obteniendo usuario:', error);
            return res.status(500).json({
                success: false,
                message: 'Error en el servidor'
            });
        }
    },

    // Actualizar usuario
    updateUser: async (req, res) => {
        try {
            const { id } = req.params;
            const { active, platformData } = req.body;
            
            const user = dataService.findUserById(id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            const updateData = {};
            if (active !== undefined) {
                updateData.active = active;
            }

            if (platformData) {
                updateData.platformData = { ...user.platformData, ...platformData };
            }

            const updatedUser = dataService.updateUser(id, updateData);

            const { password, ...userWithoutPassword } = updatedUser;
            return res.json({
                success: true,
                message: 'Usuario actualizado exitosamente',
                user: userWithoutPassword
            });
        } catch (error) {
            console.error('Error actualizando usuario:', error);
            return res.status(500).json({
                success: false,
                message: 'Error en el servidor'
            });
        }
    },

    // Eliminar usuario
    deleteUser: async (req, res) => {
        try {
            const { id } = req.params;
            
            // No permitir eliminar el usuario admin por defecto
            const user = dataService.findUserById(id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            if (user.username === process.env.ADMIN_USERNAME) {
                return res.status(400).json({
                    success: false,
                    message: 'No se puede eliminar el usuario administrador por defecto'
                });
            }

            dataService.deleteUser(id);

            return res.json({
                success: true,
                message: 'Usuario eliminado exitosamente'
            });
        } catch (error) {
            console.error('Error eliminando usuario:', error);
            return res.status(500).json({
                success: false,
                message: 'Error en el servidor'
            });
        }
    },

    // Obtener estadísticas de la plataforma del usuario actual
    getPlatformStats: async (req, res) => {
        try {
            const user = dataService.findUserById(req.user.userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            const stats = {
                tokens: user.platformData?.tokens || { used: 0, limit: 10000 },
                requests: user.platformData?.requests || { count: 0, limit: 1000 },
                studentsCount: user.platformData?.students?.length || 0,
                coursesCount: user.platformData?.courses?.length || 0,
                themesCount: user.platformData?.themes?.length || 0
            };

            return res.json({
                success: true,
                stats
            });
        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            return res.status(500).json({
                success: false,
                message: 'Error en el servidor'
            });
        }
    },

    // Actualizar uso de tokens
    updateTokenUsage: async (req, res) => {
        try {
            const { tokensUsed } = req.body;
            const user = dataService.findUserById(req.user.userId);
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            const currentTokens = user.platformData?.tokens?.used || 0;
            const updatedTokens = dataService.updateTokens(req.user.userId, {
                used: currentTokens + tokensUsed
            });

            return res.json({
                success: true,
                message: 'Uso de tokens actualizado',
                tokens: updatedTokens
            });
        } catch (error) {
            console.error('Error actualizando tokens:', error);
            return res.status(500).json({
                success: false,
                message: 'Error en el servidor'
            });
        }
    },

    // Incrementar contador de solicitudes
    incrementRequests: async (req, res) => {
        try {
            const user = dataService.findUserById(req.user.userId);
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            const currentRequests = user.platformData?.requests?.count || 0;
            const updateData = {
                platformData: {
                    ...user.platformData,
                    requests: {
                        ...user.platformData?.requests,
                        count: currentRequests + 1
                    }
                }
            };

            const updatedUser = dataService.updateUser(req.user.userId, updateData);

            return res.json({
                success: true,
                message: 'Contador de solicitudes actualizado',
                requests: updatedUser.platformData.requests
            });
        } catch (error) {
            console.error('Error actualizando solicitudes:', error);
            return res.status(500).json({
                success: false,
                message: 'Error en el servidor'
            });
        }
    }
};

module.exports = userController;