const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const { verifyToken } = require('../middleware/authMiddleware');

// Rutas específicas para profesores (cuando están logueados como profesores)
router.get('/profile', verifyToken, teacherController.getProfile);
router.put('/profile', verifyToken, teacherController.updateProfile);
router.get('/courses', verifyToken, teacherController.getCourses);
router.get('/themes', verifyToken, teacherController.getThemes);

module.exports = router;