const express = require('express');
const router = express.Router();
const platformController = require('../controllers/platformController');
const { verifyToken } = require('../middleware/authMiddleware');

// Obtener todos los cursos
router.get('/', verifyToken, platformController.getCourses);

// Agregar un nuevo curso
router.post('/', verifyToken, platformController.addCourse);

module.exports = router;