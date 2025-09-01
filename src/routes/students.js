const express = require('express');
const router = express.Router();
const studentsController = require('../controllers/studentsController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// Middleware para verificar que el usuario sea admin
router.use(verifyToken);
router.use(requireRole('admin'));

// Rutas para gestión de estudiantes
router.get('/', studentsController.getStudents);
router.post('/', studentsController.createStudent);
router.put('/:studentId', studentsController.updateStudent);
router.delete('/:studentId', studentsController.deleteStudent);

module.exports = router;