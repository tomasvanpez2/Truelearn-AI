const dataService = require('../services/dataService');

const teacherController = {
    // Obtener perfil del profesor
    getProfile: async (req, res) => {
        try {
            const teacher = await dataService.findUserById(req.user.userId);
            if (!teacher || teacher.role !== 'teacher') {
                return res.status(404).json({
                    success: false,
                    message: 'Profesor no encontrado'
                });
            }

            return res.json({
                success: true,
                teacher: {
                    id: teacher._id || teacher.id,
                    name: teacher.name,
                    email: teacher.email,
                    username: teacher.username,
                    subject: teacher.subject,
                    active: teacher.active,
                    createdAt: teacher.createdAt
                }
            });
        } catch (error) {
            console.error('Error obteniendo perfil del profesor:', error);
            return res.status(500).json({
                success: false,
                message: 'Error en el servidor'
            });
        }
    },

    // Obtener cursos disponibles para el profesor
    getCourses: async (req, res) => {
        try {
            const teacher = await dataService.findUserById(req.user.userId);
            if (!teacher || teacher.role !== 'teacher') {
                return res.status(404).json({
                    success: false,
                    message: 'Profesor no encontrado'
                });
            }

            // Obtener cursos del admin que creó este profesor
            const courses = await dataService.getCourses(teacher.adminId);

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

    // Obtener temas disponibles para el profesor
    getThemes: async (req, res) => {
        try {
            const teacher = await dataService.findUserById(req.user.userId);
            if (!teacher || teacher.role !== 'teacher') {
                return res.status(404).json({
                    success: false,
                    message: 'Profesor no encontrado'
                });
            }

            // Obtener temas del admin que creó este profesor
            const themes = await dataService.getThemes(teacher.adminId);

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

    // Actualizar perfil del profesor (datos limitados)
    updateProfile: async (req, res) => {
        try {
            const { name } = req.body; // Solo puede cambiar su nombre

            const teacher = await dataService.findUserById(req.user.userId);
            if (!teacher || teacher.role !== 'teacher') {
                return res.status(404).json({
                    success: false,
                    message: 'Profesor no encontrado'
                });
            }

            const updateData = {};
            if (name) updateData.name = name;

            const updatedTeacher = await dataService.updateUser(req.user.userId, updateData);

            return res.json({
                success: true,
                message: 'Perfil actualizado exitosamente',
                teacher: {
                    id: updatedTeacher._id || updatedTeacher.id || teacher.id,
                    name: updatedTeacher.name,
                    email: updatedTeacher.email,
                    username: updatedTeacher.username,
                    subject: updatedTeacher.subject,
                    active: updatedTeacher.active,
                    createdAt: updatedTeacher.createdAt
                }
            });
        } catch (error) {
            console.error('Error actualizando perfil del profesor:', error);
            return res.status(500).json({
                success: false,
                message: 'Error en el servidor'
            });
        }
    }
};

module.exports = teacherController;
