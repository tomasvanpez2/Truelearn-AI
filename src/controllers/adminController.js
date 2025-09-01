const bcrypt = require('bcryptjs');
const dataService = require('../services/dataService');

const adminController = {
    // Obtener todos los profesores del admin
    getTeachers: async (req, res) => {
        try {
            const adminId = req.user.userId;
            const teachers = await dataService.findTeachersByAdmin(adminId);

            return res.json({
                success: true,
                teachers: teachers.map(teacher => ({
                    id: teacher.id,
                    name: teacher.name,
                    email: teacher.email,
                    username: teacher.username,
                    subject: teacher.subject || 'No especificada',
                    active: teacher.active,
                    createdAt: teacher.createdAt,
                    updatedAt: teacher.updatedAt
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

    // Crear nuevo profesor
    createTeacher: async (req, res) => {
        try {
            const { name, email, username, password, subject } = req.body;
            const adminId = req.user.userId;

            // Validaciones
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

            // Verificar si el usuario ya existe
            const existingUser = await dataService.findUserByUsername(username);
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'El nombre de usuario ya existe'
                });
            }

            // Verificar si el email ya existe
            const existingEmail = await dataService.findUserByEmail(email);
            if (existingEmail) {
                return res.status(400).json({
                    success: false,
                    message: 'El email ya está registrado'
                });
            }

            // Hash de la contraseña
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Crear nuevo profesor
            const newTeacher = await dataService.createUser({
                name,
                email,
                username,
                password: hashedPassword,
                role: 'teacher',
                subject: subject || 'No especificada',
                active: true,
                adminId: adminId // Asociar al admin que lo creó
            });

            return res.status(201).json({
                success: true,
                message: 'Profesor creado exitosamente',
                teacher: {
                    id: newTeacher.id,
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

    // Obtener un profesor específico
    getTeacher: async (req, res) => {
        try {
            const { teacherId } = req.params;
            const adminId = req.user.userId;

            const teacher = await dataService.findTeacherById(teacherId, adminId);
            if (!teacher) {
                return res.status(404).json({
                    success: false,
                    message: 'Profesor no encontrado'
                });
            }

            return res.json({
                success: true,
                teacher: {
                    id: teacher.id,
                    name: teacher.name,
                    email: teacher.email,
                    username: teacher.username,
                    subject: teacher.subject,
                    active: teacher.active,
                    createdAt: teacher.createdAt,
                    updatedAt: teacher.updatedAt
                }
            });
        } catch (error) {
            console.error('Error obteniendo profesor:', error);
            return res.status(500).json({
                success: false,
                message: 'Error en el servidor'
            });
        }
    },

    // Actualizar profesor
    updateTeacher: async (req, res) => {
        try {
            const { teacherId } = req.params;
            const { name, email, subject, active, password } = req.body;
            const adminId = req.user.userId;

            // Verificar que el profesor pertenece al admin
            const teacher = await dataService.findTeacherById(teacherId, adminId);
            if (!teacher) {
                return res.status(404).json({
                    success: false,
                    message: 'Profesor no encontrado'
                });
            }

            const updateData = {};
            if (name) updateData.name = name;
            if (email) updateData.email = email;
            if (subject !== undefined) updateData.subject = subject;
            if (active !== undefined) updateData.active = active;

            // Si se proporciona nueva contraseña
            if (password) {
                if (password.length < 6) {
                    return res.status(400).json({
                        success: false,
                        message: 'La contraseña debe tener al menos 6 caracteres'
                    });
                }
                const salt = await bcrypt.genSalt(10);
                updateData.password = await bcrypt.hash(password, salt);
            }

            const updatedTeacher = await dataService.updateUser(teacherId, updateData);

            return res.json({
                success: true,
                message: 'Profesor actualizado exitosamente',
                teacher: {
                    id: updatedTeacher.id,
                    name: updatedTeacher.name,
                    email: updatedTeacher.email,
                    username: updatedTeacher.username,
                    subject: updatedTeacher.subject,
                    active: updatedTeacher.active,
                    createdAt: updatedTeacher.createdAt,
                    updatedAt: updatedTeacher.updatedAt
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

    // Eliminar profesor
    deleteTeacher: async (req, res) => {
        try {
            const { teacherId } = req.params;
            const adminId = req.user.userId;

            // Verificar que el profesor pertenece al admin
            const teacher = await dataService.findTeacherById(teacherId, adminId);
            if (!teacher) {
                return res.status(404).json({
                    success: false,
                    message: 'Profesor no encontrado'
                });
            }

            await dataService.deleteUser(teacherId);

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

    // Obtener estadísticas del admin
    getStats: async (req, res) => {
        try {
            const adminId = req.user.userId;
            const stats = await dataService.getAdminStats(adminId);

            return res.json({
                success: true,
                stats: stats
            });
        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            return res.status(500).json({
                success: false,
                message: 'Error en el servidor'
            });
        }
    }
};

module.exports = adminController;