const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, verifyAdmin, verifyOwnership } = require('../middleware/authMiddleware');

// Rutas para gestión de usuarios (solo super admin)
router.get('/', verifyToken, verifyAdmin, userController.getAllUsers);
router.get('/:id', verifyToken, verifyAdmin, userController.getUserById);
router.put('/:id', verifyToken, verifyAdmin, userController.updateUser);
router.delete('/:id', verifyToken, verifyAdmin, userController.deleteUser);

// Rutas para la plataforma del usuario actual
router.get('/platform/stats', verifyToken, verifyOwnership, userController.getPlatformStats);
router.post('/platform/tokens', verifyToken, verifyOwnership, userController.updateTokenUsage);
router.post('/platform/requests', verifyToken, verifyOwnership, userController.incrementRequests);

module.exports = router;