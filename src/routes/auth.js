const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

// Ruta para registro de nuevos administradores
router.post('/register', authController.register);

// Ruta para inicio de sesión
router.post('/login', authController.login);

// Ruta para obtener perfil del usuario actual
router.get('/profile', verifyToken, authController.getProfile);

// Ruta para actualizar perfil del usuario
router.put('/profile', verifyToken, authController.updateProfile);

module.exports = router;