const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// Middleware para verificar que el usuario sea admin
router.use(verifyToken);
router.use(requireRole('admin'));

// Rutas para gestión de profesores
router.get('/teachers', adminController.getTeachers);
router.post('/teachers', adminController.createTeacher);
router.get('/teachers/:teacherId', adminController.getTeacher);
router.put('/teachers/:teacherId', adminController.updateTeacher);
router.delete('/teachers/:teacherId', adminController.deleteTeacher);

// Ruta para estadísticas del admin
router.get('/stats', adminController.getStats);

module.exports = router;