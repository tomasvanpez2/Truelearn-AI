const dataService = require('../services/dataService');

const platformController = {
    // GESTIÓN DE PROFESORES
    // IMPORTANTE: Los profesores SON usuarios del sistema que pueden hacer login
    // El admin los gestiona pero ellos usan la plataforma
    getTeachers: async (req, res) => {
        try {
            const user = await dataService.findUserById(req.user.userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            // Obtener todos los profesores que pertenecen a este admin
            const teachers = await dataService.findTeachersByAdmin(req.user.userId);
            
            return res.json({
                success: true,
                teachers: teachers.map(t => ({
                    id: t._id || t.id || t.id,
                    name: t.name,
                    email: t.email,
                    username: t.username,
                    subject: t.subject,
                    active: t.active,
                    createdAt: t.createdAt
                }))
            });
        } catch (error) {
            console.error('Error obteniendo profesores:', error);
            return res.status(500).json({
                success: false,
                message: 'Error en el servidor'
            });
        }
    },

    addTeacher: async (req, res) => {
        try {
            const { name, email, username, password, subject } = req.body;

            if (!name || !email || !username || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Nombre, email, usuario y contraseña son requeridos'
                });
            }

            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'La contraseña debe tener al menos 6 caracteres'
                });
            }

            // Verificar que el admin existe
            const admin = await dataService.findUserById(req.user.userId);
            if (!admin || admin.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Solo los administradores pueden crear profesores'
                });
            }

            // Verificar si el username o email ya existen
            const existingUser = await dataService.findUserByUsername(username);
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'El nombre de usuario ya existe'
                });
            }

            const existingEmail = await dataService.findUserByEmail(email);
            if (existingEmail) {
                return res.status(400).json({
                    success: false,
                    message: 'El email ya está registrado'
                });
            }

            // Hash de la contraseña
            const bcrypt = require('bcryptjs');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Crear nuevo profesor
            const newTeacher = await dataService.createUser({
                name,
                email,
                username,
                password: hashedPassword,
                role: 'teacher',
                subject: subject || '',
                adminId: req.user.userId, // Asociar con el admin que lo creó
                active: true
            });

            return res.status(201).json({
                success: true,
                message: 'Profesor creado exitosamente',
                teacher: {
                    id: newTeacher._id || newTeacher.id,
                    name: newTeacher.name,
                    email: newTeacher.email,
                    username: newTeacher.username,
                    subject: newTeacher.subject,
                    active: newTeacher.active,
                    createdAt: newTeacher.createdAt
                }
            });
        } catch (error) {
            console.error('Error creando profesor:', error);
            return res.status(500).json({
                success: false,
                message: 'Error en el servidor'
            });
        }
    },

    updateTeacher: async (req, res) => {
        try {
            const { teacherId } = req.params;
            const { name, email, subject, active } = req.body;

            // Verificar que el admin existe
            const admin = await dataService.findUserById(req.user.userId);
            if (!admin || admin.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Solo los administradores pueden actualizar profesores'
                });
            }

            // Buscar el profesor
            const teacher = await dataService.findTeacherById(teacherId, req.user.userId);
            if (!teacher) {
                return res.status(404).json({
                    success: false,
                    message: 'Profesor no encontrado'
                });
            }

            // Verificar email único si se está cambiando
            if (email && email !== teacher.email) {
                const existingEmail = await dataService.findUserByEmail(email);
                if (existingEmail) {
                    return res.status(400).json({
                        success: false,
                        message: 'El email ya está registrado'
                    });
                }
            }

            // Actualizar datos
            const updateData = {};
            if (name) updateData.name = name;
            if (email) updateData.email = email;
            if (subject !== undefined) updateData.subject = subject;
            if (active !== undefined) updateData.active = active;

            const updatedTeacher = await dataService.updateUser(teacherId, updateData);

            return res.json({
                success: true,
                message: 'Profesor actualizado exitosamente',
                teacher: {
                    id: updatedTeacher._id || updatedTeacher.id,
                    name: updatedTeacher.name,
                    email: updatedTeacher.email,
                    username: updatedTeacher.username,
                    subject: updatedTeacher.subject,
                    active: updatedTeacher.active,
                    createdAt: updatedTeacher.createdAt
                }
            });
        } catch (error) {
            console.error('Error actualizando profesor:', error);
            return res.status(500).json({
                success: false,
                message: 'Error en el servidor'
            });
        }
    },

    deleteTeacher: async (req, res) => {
        try {
            const { teacherId } = req.params;

            // Verificar que el admin existe
            const admin = await dataService.findUserById(req.user.userId);
            if (!admin || admin.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Solo los administradores pueden eliminar profesores'
                });
            }

            // Buscar el profesor
            const teacher = await dataService.findTeacherById(teacherId, req.user.userId);
            if (!teacher) {
                return res.status(404).json({
                    success: false,
                    message: 'Profesor no encontrado'
                });
            }

            // Eliminar el profesor
            const deleted = await dataService.deleteUser(teacherId);
            if (!deleted) {
                return res.status(500).json({
                    success: false,
                    message: 'Error eliminando profesor'
                });
            }

            return res.json({
                success: true,
                message: 'Profesor eliminado exitosamente'
            });
        } catch (error) {
            console.error('Error eliminando profesor:', error);
            return res.status(500).json({
                success: false,
                message: 'Error en el servidor'
            });
        }
    },

    // CURSOS
    getCourses: async (req, res) => {
        try {
            const courses = await dataService.getCourses(req.user.userId);
            return res.json({
                success: true,
                courses: courses
            });
        } catch (error) {
            console.error('Error obteniendo cursos:', error);
            return res.status(500).json({
                success: false,
                message: 'Error en el servidor'
            });
        }
    },

    addCourse: async (req, res) => {
        try {
            const { name, description } = req.body;

            if (!name) {
                return res.status(400).json({
                    success: false,
                    message: 'El nombre del curso es requerido'
                });
            }

            const newCourse = await dataService.addCourse(req.user.userId, {
                name,
                description: description || ''
            });

            if (!newCourse) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            return res.status(201).json({
                success: true,
                message: 'Curso agregado exitosamente',
                course: newCourse
            });
        } catch (error) {
            console.error('Error agregando curso:', error);
            return res.status(500).json({
                success: false,
                message: 'Error en el servidor'
            });
        }
    },

    // TEMAS
    getThemes: async (req, res) => {
        try {
            const themes = await dataService.getThemes(req.user.userId);
            return res.json({
                success: true,
                themes: themes
            });
        } catch (error) {
            console.error('Error obteniendo temas:', error);
            return res.status(500).json({
                success: false,
                message: 'Error en el servidor'
            });
        }
    },

    addTheme: async (req, res) => {
        try {
            const { name, description } = req.body;

            if (!name) {
                return res.status(400).json({
                    success: false,
                    message: 'El nombre del tema es requerido'
                });
            }

            const newTheme = await dataService.addTheme(req.user.userId, {
                name,
                description: description || ''
            });

            if (!newTheme) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            return res.status(201).json({
                success: true,
                message: 'Tema agregado exitosamente',
                theme: newTheme
            });
        } catch (error) {
            console.error('Error agregando tema:', error);
            return res.status(500).json({
                success: false,
                message: 'Error en el servidor'
            });
        }
    },

    // ESTADÍSTICAS Y TOKENS
    getStats: async (req, res) => {
        try {
            const stats = await dataService.getAdminStats(req.user.userId);
            
            if (!stats) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

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

    // Endpoint específico para ver el límite dinámico del admin
    getDynamicTokenLimit: async (req, res) => {
        try {
            const user = await dataService.findUserById(req.user.userId);
            if (!user || user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Solo los administradores pueden acceder a esta información'
                });
            }

            const accumulatedTokens = await dataService.getAdminTokensWithAccumulatedUsage(req.user.userId);
            const teachers = await dataService.findTeachersByAdmin(req.user.userId);
            
            const teachersTokenInfo = teachers.map(teacher => ({
                id: teacher.id,
                name: teacher.name,
                subject: teacher.subject,
                tokensUsed: teacher.platformData?.tokens?.used || 0,
                tokensLimit: teacher.platformData?.tokens?.limit || 0
            }));

            return res.json({
                success: true,
                data: {
                    adminTokens: accumulatedTokens,
                    teachersCount: teachers.length,
                    teachersTokenInfo,
                    explanation: 'Los tokens usados por los profesores se suman al uso total del admin'
                }
            });
        } catch (error) {
            console.error('Error obteniendo límite dinámico:', error);
            return res.status(500).json({
                success: false,
                message: 'Error en el servidor'
            });
        }
    },

    updateTokens: async (req, res) => {
        try {
            const { used, limit } = req.body;

            const tokens = await dataService.updateTokens(req.user.userId, { used, limit });
            
            if (!tokens) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            return res.json({
                success: true,
                message: 'Tokens actualizados exitosamente',
                tokens
            });
        } catch (error) {
            console.error('Error actualizando tokens:', error);
            return res.status(500).json({
                success: false,
                message: 'Error en el servidor'
            });
        }
    },

    // CONFIGURACIÓN DE USUARIO
    updateProfile: async (req, res) => {
        try {
            const { username } = req.body;

            if (!username) {
                return res.status(400).json({
                    success: false,
                    message: 'El nombre de usuario es requerido'
                });
            }

            const user = await dataService.findUserById(req.user.userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            // Verificar si el username ya existe
            const existingUser = await dataService.findUserByUsername(username);
            if (existingUser && existingUser._id.toString() !== req.user.userId) {
                return res.status(400).json({
                    success: false,
                    message: 'El nombre de usuario ya está en uso'
                });
            }

            const updatedUser = await dataService.updateUser(req.user.userId, { username });

            return res.json({
                success: true,
                message: 'Perfil actualizado exitosamente',
                user: {
                    id: updatedUser._id || updatedUser.id,
                    username: updatedUser.username,
                    role: updatedUser.role,
                    active: updatedUser.active,
                    platformData: updatedUser.platformData,
                    createdAt: updatedUser.createdAt,
                    updatedAt: updatedUser.updatedAt
                }
            });
        } catch (error) {
            console.error('Error actualizando perfil:', error);
            return res.status(500).json({
                success: false,
                message: 'Error en el servidor'
            });
        }
    },

    // Verificar si se pueden usar tokens adicionales
    checkTokenUsage: async (req, res) => {
        try {
            const { additionalTokens, teacherId } = req.body;

            if (!additionalTokens || additionalTokens <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere especificar tokens adicionales válidos'
                });
            }

            let adminId = req.user.userId;

            // Si se especifica un teacherId, obtener el admin de ese profesor
            if (teacherId) {
                const teacher = await dataService.findUserById(teacherId);
                if (!teacher || teacher.role !== 'teacher') {
                    return res.status(404).json({
                        success: false,
                        message: 'Profesor no encontrado'
                    });
                }
                adminId = teacher.adminId;
            }

            const verification = await dataService.canAdminAllowTokenUsage(adminId, additionalTokens);

            return res.json({
                success: true,
                verification
            });
        } catch (error) {
            console.error('Error verificando uso de tokens:', error);
            return res.status(500).json({
                success: false,
                message: 'Error en el servidor'
            });
        }
    },

    // Verificar estado actual de tokens del admin
    getTokenStatus: async (req, res) => {
        try {
            let adminId = req.user.userId;

            // Si el usuario es profesor, obtener su admin
            if (req.user.role === 'teacher') {
                const teacher = await dataService.findUserById(req.user.userId);
                adminId = teacher?.adminId;
            }

            if (!adminId) {
                return res.status(404).json({
                    success: false,
                    message: 'Admin no encontrado'
                });
            }

            const tokenData = await dataService.getAdminTokensWithAccumulatedUsage(adminId);
            
            if (!tokenData) {
                return res.status(404).json({
                    success: false,
                    message: 'Datos de tokens no encontrados'
                });
            }

            const percentage = (tokenData.used / tokenData.limit) * 100;
            let status = 'normal';
            let message = 'Tokens disponibles';

            if (percentage >= 100) {
                status = 'exhausted';
                message = '❌ Tokens agotados - No puedes realizar más análisis';
            } else if (percentage >= 90) {
                status = 'critical';
                message = '⚠️ Tokens críticos - Quedan pocos tokens disponibles';
            } else if (percentage >= 75) {
                status = 'warning';
                message = '⚠️ Advertencia - Tokens en nivel de alerta';
            }

            return res.json({
                success: true,
                tokenStatus: {
                    ...tokenData,
                    percentage: Math.round(percentage * 100) / 100,
                    status,
                    message,
                    canAnalyze: tokenData.remaining > 2000 // Mínimo para un análisis
                }
            });
        } catch (error) {
            console.error('Error obteniendo estado de tokens:', error);
            return res.status(500).json({
                success: false,
                message: 'Error en el servidor'
            });
        }
    },

    // GESTIÓN DE ESTUDIANTES
    getStudents: async (req, res) => {
        try {
            const students = await dataService.getStudents(req.user.userId);
            return res.json({
                success: true,
                students
            });
        } catch (error) {
            console.error('Error obteniendo estudiantes:', error);
            return res.status(500).json({
                success: false,
                message: 'Error en el servidor'
            });
        }
    },

    addStudent: async (req, res) => {
        try {
            const { name, course, tokenLimit } = req.body;

            if (!name) {
                return res.status(400).json({
                    success: false,
                    message: 'El nombre del estudiante es requerido'
                });
            }

            const newStudent = await dataService.addStudent(req.user.userId, {
                name,
                course: course || '',
                tokenLimit: tokenLimit || 1000
            });

            if (!newStudent) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            return res.status(201).json({
                success: true,
                message: 'Estudiante agregado exitosamente',
                student: newStudent
            });
        } catch (error) {
            console.error('Error agregando estudiante:', error);
            return res.status(500).json({
                success: false,
                message: 'Error en el servidor'
            });
        }
    },

    updateStudentTokens: async (req, res) => {
        try {
            const { studentId, tokensUsed } = req.body;

            if (!studentId || !tokensUsed || tokensUsed <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'ID del estudiante y tokens usados son requeridos'
                });
            }

            // Los estudiantes NO tienen límite de tokens, solo actualizamos el uso
            const updatedStudent = await dataService.updateStudentTokens(req.user.userId, studentId, tokensUsed);

            if (!updatedStudent) {
                return res.status(404).json({
                    success: false,
                    message: 'Estudiante no encontrado'
                });
            }

            return res.json({
                success: true,
                message: 'Tokens del estudiante actualizados (sin límite)',
                student: updatedStudent
            });
        } catch (error) {
            console.error('Error actualizando tokens del estudiante:', error);
            return res.status(500).json({
                success: false,
                message: 'Error en el servidor'
            });
        }
    },

    checkStudentTokens: async (req, res) => {
        try {
            const { studentId } = req.params;

            const tokenInfo = await dataService.getStudentTokenInfo(req.user.userId, studentId);

            return res.json({
                success: true,
                message: 'Los estudiantes no tienen límite de tokens',
                tokenInfo: {
                    ...tokenInfo,
                    hasTokens: true, // Siempre tienen tokens disponibles
                    unlimited: true
                }
            });
        } catch (error) {
            console.error('Error obteniendo información de tokens del estudiante:', error);
            return res.status(500).json({
                success: false,
                message: 'Error en el servidor'
            });
        }
    },

    // GESTIÓN DE RANKINGS
    getRankings: async (req, res) => {
        try {
            const { themeId } = req.query;
            const rankings = await dataService.getRankings(req.user.userId, themeId);
            
            return res.json({
                success: true,
                rankings
            });
        } catch (error) {
            console.error('Error obteniendo rankings:', error);
            return res.status(500).json({
                success: false,
                message: 'Error en el servidor'
            });
        }
    },

    addRanking: async (req, res) => {
        try {
            const { themeId, themeName, studentId, studentName, score, tokensUsed } = req.body;

            if (!themeId || !studentId || score === undefined) {
                return res.status(400).json({
                    success: false,
                    message: 'ID del tema, ID del estudiante y puntuación son requeridos'
                });
            }

            const newRanking = await dataService.addRanking(req.user.userId, {
                themeId,
                themeName: themeName || '',
                studentId,
                studentName: studentName || '',
                score,
                tokensUsed: tokensUsed || 0
            });

            if (!newRanking) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            return res.status(201).json({
                success: true,
                message: 'Ranking agregado exitosamente',
                ranking: newRanking
            });
        } catch (error) {
            console.error('Error agregando ranking:', error);
            return res.status(500).json({
                success: false,
                message: 'Error en el servidor'
            });
        }
    }
};

module.exports = platformController;
