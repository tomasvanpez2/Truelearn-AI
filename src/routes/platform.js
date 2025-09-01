const express = require('express');
const router = express.Router();
const platformController = require('../controllers/platformController');
const { verifyToken } = require('../middleware/authMiddleware');

// GESTIÓN DE PROFESORES (solo para admins)
router.get('/teachers', verifyToken, platformController.getTeachers);
router.post('/teachers', verifyToken, platformController.addTeacher);
router.put('/teachers/:teacherId', verifyToken, platformController.updateTeacher);
router.delete('/teachers/:teacherId', verifyToken, platformController.deleteTeacher);

// GESTIÓN DE CURSOS
router.get('/courses', verifyToken, platformController.getCourses);
router.post('/courses', verifyToken, platformController.addCourse);

// GESTIÓN DE TEMAS
router.get('/themes', verifyToken, platformController.getThemes);
router.post('/themes', verifyToken, platformController.addTheme);

// GESTIÓN DE ESTUDIANTES
router.get('/students', verifyToken, platformController.getStudents);
router.post('/students', verifyToken, platformController.addStudent);
router.put('/students/tokens', verifyToken, platformController.updateStudentTokens);
router.get('/students/:studentId/tokens', verifyToken, platformController.checkStudentTokens);

// GESTIÓN DE RANKINGS
router.get('/rankings', verifyToken, platformController.getRankings);
router.post('/rankings', verifyToken, platformController.addRanking);

// TOKENS
router.put('/tokens', verifyToken, platformController.updateTokens);
router.get('/tokens/dynamic-limit', verifyToken, platformController.getDynamicTokenLimit);
router.post('/tokens/check-usage', verifyToken, platformController.checkTokenUsage);
router.get('/tokens/status', verifyToken, platformController.getTokenStatus);

// Obtener estadísticas generales de la plataforma
router.get('/stats', verifyToken, platformController.getStats);

// Actualizar perfil del usuario
router.put('/profile', verifyToken, platformController.updateProfile);

module.exports = router;