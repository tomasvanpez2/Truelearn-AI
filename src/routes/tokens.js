const express = require('express');
const router = express.Router();
const tokenController = require('../controllers/tokenController');
const { verifyToken } = require('../middleware/authMiddleware');

// Ruta para obtener estadísticas generales del sistema
router.get('/stats', verifyToken, tokenController.getSystemStats);

// Ruta para obtener resumen de todos los usuarios
router.get('/summary/all', verifyToken, tokenController.getAllTokenSummaries);

// Ruta para obtener resumen de un usuario específico
router.get('/summary/:studentName', verifyToken, tokenController.getUserTokenSummary);

// Ruta para obtener el log completo de un usuario específico
router.get('/log/:studentName', verifyToken, tokenController.getUserTokenLog);

module.exports = router;