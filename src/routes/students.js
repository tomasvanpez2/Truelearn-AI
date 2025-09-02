const express = require('express');
const router = express.Router();
const studentsController = require('../controllers/studentsController');
const { verifyToken, requireRole, checkRole } = require('../middleware/authMiddleware');

// Middleware para verificar autenticación
router.use(verifyToken);
// Permitir acceso a admins y teachers
router.use(checkRole(['admin', 'teacher']));

// Rutas para gestión de estudiantes
router.get('/', studentsController.getStudents);
router.post('/', studentsController.createStudent);
router.put('/:studentId', studentsController.updateStudent);
router.delete('/:studentId', studentsController.deleteStudent);

module.exports = router;