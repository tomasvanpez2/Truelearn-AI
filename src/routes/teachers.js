const express = require('express');
const router = express.Router();
const platformController = require('../controllers/platformController');
const { verifyToken } = require('../middleware/authMiddleware');

// Obtener todos los profesores
router.get('/', verifyToken, platformController.getTeachers);

// Agregar un nuevo profesor
router.post('/', verifyToken, platformController.addTeacher);

// Actualizar un profesor
router.put('/:teacherId', verifyToken, platformController.updateTeacher);

// Eliminar un profesor
router.delete('/:teacherId', verifyToken, platformController.deleteTeacher);

module.exports = router;