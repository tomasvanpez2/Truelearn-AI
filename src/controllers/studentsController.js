const dataService = require('../services/dataService');

const studentsController = {
    // Obtener estudiantes
    getStudents: async (req, res) => {
        try {
            const userId = req.user.userId;
            const userRole = req.user.role;
            const { course } = req.query;
            
            let targetUser;
            
            if (userRole === 'admin') {
                // Si es admin, obtener sus propios estudiantes
                targetUser = await dataService.findUserById(userId);
            } else if (userRole === 'teacher') {
                // Si es teacher, obtener estudiantes de su admin
                const teacher = await dataService.findUserById(userId);
                if (!teacher || !teacher.adminId) {
                    return res.status(403).json({
                        success: false,
                        message: 'Teacher no tiene admin asignado'
                    });
                }
                targetUser = await dataService.findUserById(teacher.adminId);
            } else {
                return res.status(403).json({
                    success: false,
                    message: 'Acceso no autorizado'
                });
            }

            if (!targetUser) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            // Los estudiantes están almacenados en platformData.students del admin
            let students = targetUser.platformData?.students || [];
            
            // Filtrar por curso si se especifica
            if (course) {
                students = students.filter(student => student.course === course);
            }

            return res.json(students);
        } catch (error) {
            console.error('Error obteniendo estudiantes:', error);
            return res.status(500).json({
                success: false,
                message: 'Error en el servidor'
            });
        }
    },

    // Crear nuevo estudiante
    createStudent: async (req, res) => {
        try {
            const userId = req.user.userId;
            const userRole = req.user.role;
            const { name, course } = req.body;

            if (!name || !course) {
                return res.status(400).json({
                    success: false,
                    message: 'Nombre y curso son requeridos'
                });
            }

            let admin;
            
            if (userRole === 'admin') {
                admin = await dataService.findUserById(userId);
            } else if (userRole === 'teacher') {
                const teacher = await dataService.findUserById(userId);
                if (!teacher || !teacher.adminId) {
                    return res.status(403).json({
                        success: false,
                        message: 'Teacher no tiene admin asignado'
                    });
                }
                admin = await dataService.findUserById(teacher.adminId);
            } else {
                return res.status(403).json({
                    success: false,
                    message: 'Acceso no autorizado'
                });
            }

            if (!admin) {
                return res.status(404).json({
                    success: false,
                    message: 'Admin no encontrado'
                });
            }

            // Crear nuevo estudiante
            const newStudent = {
                id: Date.now().toString(),
                name: name.trim(),
                course: course,
                createdAt: new Date().toISOString()
            };

            // Inicializar platformData si no existe
            if (!admin.platformData) {
                admin.platformData = {
                    tokens: { used: 0, limit: 10000 },
                    requests: { count: 0, limit: 1000 },
                    students: [],
                    courses: [],
                    themes: []
                };
            }

            // Inicializar students si no existe
            if (!admin.platformData.students) {
                admin.platformData.students = [];
            }

            // Agregar el nuevo estudiante
            admin.platformData.students.push(newStudent);

            // Actualizar en la base de datos
            await dataService.updateUser(adminId, { platformData: admin.platformData });

            return res.status(201).json({
                success: true,
                message: 'Estudiante creado exitosamente',
                student: newStudent
            });
        } catch (error) {
            console.error('Error creando estudiante:', error);
            return res.status(500).json({
                success: false,
                message: 'Error en el servidor'
            });
        }
    },

    // Actualizar estudiante
    updateStudent: async (req, res) => {
        try {
            const adminId = req.user.userId;
            const { studentId } = req.params;
            const { name, course } = req.body;

            if (!name || !course) {
                return res.status(400).json({
                    success: false,
                    message: 'Nombre y curso son requeridos'
                });
            }

            const admin = await dataService.findUserById(adminId);
            if (!admin || admin.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Solo los administradores pueden actualizar estudiantes'
                });
            }

            // Buscar el estudiante
            const students = admin.platformData?.students || [];
            const studentIndex = students.findIndex(s => s.id === studentId);

            if (studentIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Estudiante no encontrado'
                });
            }

            // Actualizar el estudiante
            students[studentIndex] = {
                ...students[studentIndex],
                name: name.trim(),
                course: course,
                updatedAt: new Date().toISOString()
            };

            // Actualizar en la base de datos
            await dataService.updateUser(adminId, { platformData: admin.platformData });

            return res.json({
                success: true,
                message: 'Estudiante actualizado exitosamente',
                student: students[studentIndex]
            });
        } catch (error) {
            console.error('Error actualizando estudiante:', error);
            return res.status(500).json({
                success: false,
                message: 'Error en el servidor'
            });
        }
    },

    // Eliminar estudiante
    deleteStudent: async (req, res) => {
        try {
            const adminId = req.user.userId;
            const { studentId } = req.params;

            const admin = await dataService.findUserById(adminId);
            if (!admin || admin.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Solo los administradores pueden eliminar estudiantes'
                });
            }

            // Buscar y eliminar el estudiante
            const students = admin.platformData?.students || [];
            const studentIndex = students.findIndex(s => s.id === studentId);

            if (studentIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Estudiante no encontrado'
                });
            }

            // Eliminar el estudiante
            const deletedStudent = students.splice(studentIndex, 1)[0];

            // Actualizar en la base de datos
            await dataService.updateUser(adminId, { platformData: admin.platformData });

            return res.json({
                success: true,
                message: 'Estudiante eliminado exitosamente',
                student: deletedStudent
            });
        } catch (error) {
            console.error('Error eliminando estudiante:', error);
            return res.status(500).json({
                success: false,
                message: 'Error en el servidor'
            });
        }
    }
};

module.exports = studentsController;