const mongoSimulatorService = require('../services/mongoSimulatorService');

const platformController = {
    // GESTIÓN DE PROFESORES
    getTeachers: async (req, res) => {
        try {
            const user = await mongoSimulatorService.findUserById(req.user.userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            // Obtener todos los profesores que pertenecen a este admin
            const teachers = await mongoSimulatorService.findTeachersByAdmin(req.user.userId);
            
            return res.json({
                success: true,
                teachers: teachers.map(t => ({
                    id: t._id || t.id,
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
            const admin = await mongoSimulatorService.findUserById(req.user.userId);
            if (!admin || admin.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Solo los administradores pueden crear profesores'
                });
            }

            // Verificar si el username o email ya existen
            const existingUser = await mongoSimulatorService.findUserByUsername(username);
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'El nombre de usuario ya existe'
                });
            }

            const existingEmail = await mongoSimulatorService.findUserByEmail(email);
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
            const newTeacher = await mongoSimulatorService.createUser({
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
            const admin = await mongoSimulatorService.findUserById(req.user.userId);
            if (!admin || admin.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Solo los administradores pueden actualizar profesores'
                });
            }

            // Buscar el profesor
            const teacher = await mongoSimulatorService.findTeacherById(teacherId, req.user.userId);
            if (!teacher) {
                return res.status(404).json({
                    success: false,
                    message: 'Profesor no encontrado'
                });
            }

            // Verificar email único si se está cambiando
            if (email && email !== teacher.email) {
                const existingEmail = await mongoSimulatorService.findUserByEmail(email);
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

            const updatedTeacher = await mongoSimulatorService.updateUser(teacherId, updateData);

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
            const admin = await mongoSimulatorService.findUserById(req.user.userId);
            if (!admin || admin.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Solo los administradores pueden eliminar profesores'
                });
            }

            // Buscar el profesor
            const teacher = await mongoSimulatorService.findTeacherById(teacherId, req.user.userId);
            if (!teacher) {
                return res.status(404).json({
                    success: false,
                    message: 'Profesor no encontrado'
                });
            }

            // Eliminar el profesor
            const deleted = await mongoSimulatorService.deleteUser(teacherId);
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
            const courses = await mongoSimulatorService.getCourses(req.user.userId);
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

            const newCourse = await mongoSimulatorService.addCourse(req.user.userId, {
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
            const themes = await mongoSimulatorService.getThemes(req.user.userId);
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

            const newTheme = await mongoSimulatorService.addTheme(req.user.userId, {
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
            const stats = await mongoSimulatorService.getAdminStats(req.user.userId);
            
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

    updateTokens: async (req, res) => {
        try {
            const { used, limit } = req.body;

            const tokens = await mongoSimulatorService.updateTokens(req.user.userId, { used, limit });
            
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

            const user = await mongoSimulatorService.findUserById(req.user.userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            // Verificar si el username ya existe
            const existingUser = await mongoSimulatorService.findUserByUsername(username);
            if (existingUser && (existingUser._id !== req.user.userId && existingUser.id !== req.user.userId)) {
                return res.status(400).json({
                    success: false,
                    message: 'El nombre de usuario ya está en uso'
                });
            }

            const updatedUser = await mongoSimulatorService.updateUser(req.user.userId, { username });

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
    }
};

module.exports = platformController;