const express = require('express');
const router = express.Router();
const platformController = require('../controllers/platformController');
const { verifyToken } = require('../middleware/authMiddleware');

// Obtener todos los temas
router.get('/', verifyToken, platformController.getThemes);

// Agregar un nuevo tema
router.post('/', verifyToken, platformController.addTheme);

module.exports = router;
